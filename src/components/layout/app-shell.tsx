"use client";

import { SiteHeader } from "@/components/layout/site-header";
import { usePathname } from "@/i18n/navigation";

export function AppShell({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSearch = pathname === "/search" || pathname.startsWith("/search/");

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className={isSearch ? "min-h-0 flex-1" : "flex-1"}>{children}</main>
      {!isSearch && footer}
    </div>
  );
}
