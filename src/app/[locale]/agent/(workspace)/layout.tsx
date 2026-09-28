import { AgentNav } from "@/components/agent/agent-nav";
import {
  AgentPaywallBanner,
  AgentWorkspaceProvider,
} from "@/components/agent/workspace-lock";
import { signInHref } from "@/lib/auth-redirect";
import { getSessionUser } from "@/lib/session";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

export default async function AgentWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getSessionUser();

  if (!user) {
    redirect(`/${locale}${signInHref("/agent")}`);
  }

  if (user.role !== "AGENT" && user.role !== "ADMIN") {
    redirect(`/${locale}/account`);
  }

  return (
    <AgentWorkspaceProvider unlocked={user.subscribed}>
      <div className="flex min-h-screen flex-col bg-[#f4f7fb]">
        <AgentNav />
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <AgentPaywallBanner />
          {children}
        </div>
      </div>
    </AgentWorkspaceProvider>
  );
}
