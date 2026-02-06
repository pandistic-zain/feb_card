import { redirect, notFound } from "next/navigation";
import { AdminLogin } from "@/components/admin-login";
import { getAdminConfig, isAdminAuthenticated } from "@/lib/admin-session";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function HiddenAdminLoginPage({ params }: Props) {
  const { slug } = await params;
  const config = getAdminConfig();

  if (slug !== config.routeSlug) {
    notFound();
  }

  const authenticated = await isAdminAuthenticated();
  if (authenticated) {
    redirect(`/${slug}/dashboard`);
  }

  return <AdminLogin slug={slug} />;
}
