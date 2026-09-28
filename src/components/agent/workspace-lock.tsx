"use client";

import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/navigation";
import { createContext, useContext } from "react";
import { useTranslations } from "next-intl";

const AgentWorkspaceContext = createContext({ unlocked: true });

export function AgentWorkspaceProvider({
  unlocked,
  children,
}: {
  unlocked: boolean;
  children: React.ReactNode;
}) {
  return (
    <AgentWorkspaceContext.Provider value={{ unlocked }}>
      {children}
    </AgentWorkspaceContext.Provider>
  );
}

export function useAgentWorkspace() {
  return useContext(AgentWorkspaceContext);
}

export function AgentPaywallBanner() {
  const { unlocked } = useAgentWorkspace();
  const pathname = usePathname();
  const t = useTranslations("agent");

  if (unlocked || pathname.includes("/packages")) return null;

  return (
    <div className="mb-6 rounded-2xl border border-pisome-navy/15 bg-white p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
      <div>
        <p className="font-medium text-pisome-navy">{t("paywallTitle")}</p>
        <p className="mt-1 text-sm text-pisome-muted">{t("paywallBody")}</p>
      </div>
      <Link href="/agent/packages" className="mt-3 inline-flex sm:mt-0">
        <Button>{t("choosePlan")}</Button>
      </Link>
    </div>
  );
}

export function LockedWorkspaceNotice({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  const t = useTranslations("agent");

  return (
    <div className="mt-8 rounded-2xl border border-dashed border-pisome-border bg-white p-8 text-center">
      <p className="font-display text-xl font-semibold text-pisome-navy">
        {title}
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm text-pisome-muted">{body}</p>
      <Link href="/agent/packages" className="mt-5 inline-flex">
        <Button>{t("choosePlan")}</Button>
      </Link>
    </div>
  );
}
