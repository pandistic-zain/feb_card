import { notFound, redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";
import { getAdminConfig, isAdminAuthenticated } from "@/lib/admin-session";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function HiddenAdminDashboardPage({ params }: Props) {
  const { slug } = await params;
  const config = getAdminConfig();

  if (slug !== config.routeSlug) {
    notFound();
  }

  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    redirect(`/${slug}`);
  }

  return <AdminDashboard slug={slug} />;
}
