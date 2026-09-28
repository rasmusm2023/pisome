"use client";

import { SiteHeader } from "@/components/layout/site-header";
import { usePathname } from "@/i18n/navigation";

function isAgentWorkspace(pathname: string) {
  if (!pathname.startsWith("/agent")) return false;
  if (pathname === "/agent/join" || pathname.startsWith("/agent/join/")) {
    return false;
  }
  return true;
}

export function AppShell({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSearch = pathname === "/search" || pathname.startsWith("/search/");
  const isHome = pathname === "/";
  const agentWorkspace = isAgentWorkspace(pathname);

  if (agentWorkspace) {
    return <div className="flex min-h-screen flex-col bg-[#07111f]">{children}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader overlay={isHome} />
      <main className={isSearch ? "min-h-0 flex-1" : "flex-1"}>{children}</main>
      {!isSearch && footer}
    </div>
  );
}
