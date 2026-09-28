"use client";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const NAV = [
  { href: "/agent", key: "dashboard" },
  { href: "/agent/listings/new", key: "newListing" },
  { href: "/agent/inquiries", key: "inquiries" },
  { href: "/agent/packages", key: "packages" },
] as const;

export function AgentNav() {
  const t = useTranslations("agent");
  const tNav = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    if (isSupabaseConfigured()) {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    }
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-white/10 bg-[#081628] text-white">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link href="/agent" className="inline-flex items-center gap-2">
            <Logo inverted />
            <span className="hidden text-xs font-semibold uppercase tracking-[0.16em] text-white/50 sm:inline">
              {t("productLabel")}
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white"
          >
            {t("backToMarketplace")}
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="border-white/30 bg-white/10 text-white hover:bg-white/20"
            onClick={handleSignOut}
          >
            {tNav("signOut")}
          </Button>
        </div>
      </div>
      <nav className="flex flex-wrap gap-1 px-4 pb-3 sm:px-6 lg:px-8">
        {NAV.map((item) => {
          const active =
            item.href === "/agent"
              ? pathname === "/agent"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium",
                active
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white",
              )}
            >
              {t(item.key)}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
