import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "fc_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function sha256(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

export function getAdminConfig() {
  return {
    username: process.env.ADMIN_USERNAME ?? "admin",
    password: process.env.ADMIN_PASSWORD ?? "change-me-now",
    routeSlug: process.env.ADMIN_ROUTE_SLUG ?? "giggle-wormhole-otter-lounge",
  };
}

export function buildAdminSessionToken(username: string, password: string) {
  return sha256(`${username}:${password}:${process.env.POSTGRES_URL ?? "local"}`);
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const current = cookieStore.get(COOKIE_NAME)?.value;
  if (!current) return false;

  const config = getAdminConfig();
  const expected = buildAdminSessionToken(config.username, config.password);

  const left = Buffer.from(current);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;

  return timingSafeEqual(left, right);
}

export function getAdminCookieName() {
  return COOKIE_NAME;
}

export function getAdminCookieMaxAge() {
  return SESSION_TTL_SECONDS;
}
