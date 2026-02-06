import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  buildAdminSessionToken,
  getAdminConfig,
  getAdminCookieMaxAge,
  getAdminCookieName,
} from "@/lib/admin-session";

const bodySchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().trim().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid credentials format" }, { status: 400 });
    }

    const config = getAdminConfig();
    const valid =
      parsed.data.username === config.username && parsed.data.password === config.password;

    if (!valid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = buildAdminSessionToken(config.username, config.password);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(getAdminCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: getAdminCookieMaxAge(),
    });

    return response;
  } catch (error) {
    console.error("Admin login failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
