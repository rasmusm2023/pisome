"use client";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Heart, Menu, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

export function SiteHeader() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const otherLocale = locale === "es" ? "en" : "es";

  const links = [
    { href: "/search", label: t("nav.search") },
    { href: "/saved", label: t("nav.saved") },
    { href: "/agent", label: t("nav.list") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-pisome-border/70 bg-white/85 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium text-pisome-muted transition hover:bg-pisome-alice hover:text-pisome-navy",
                pathname.startsWith(link.href) && "bg-pisome-alice text-pisome-navy",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href={pathname}
            locale={otherLocale}
            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-pisome-muted hover:bg-pisome-alice hover:text-pisome-navy"
          >
            {otherLocale}
          </Link>
          {session?.user ? (
            <>
              {(session.user.role === "AGENT" || session.user.role === "ADMIN") && (
                <Link href="/agent">
                  <Button variant="ghost" size="sm">
                    {t("nav.agent")}
                  </Button>
                </Link>
              )}
              <Link href="/saved" aria-label={t("nav.saved")}>
                <Button variant="ghost" size="sm">
                  <Heart className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                {t("nav.signOut")}
              </Button>
            </>
          ) : (
            <Link href="/auth/signin">
              <Button size="sm">{t("nav.signIn")}</Button>
            </Link>
          )}
        </div>

        <button
          className="rounded-lg p-2 text-pisome-navy md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-pisome-border bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-3 text-sm font-medium text-pisome-navy hover:bg-pisome-alice"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={pathname}
              locale={otherLocale}
              className="rounded-lg px-3 py-3 text-sm font-medium uppercase text-pisome-muted"
              onClick={() => setOpen(false)}
            >
              {otherLocale}
            </Link>
            {session?.user ? (
              <button
                className="rounded-lg px-3 py-3 text-left text-sm font-medium text-pisome-navy"
                onClick={() => signOut()}
              >
                {t("nav.signOut")}
              </button>
            ) : (
              <Link
                href="/auth/signin"
                className="rounded-lg px-3 py-3 text-sm font-medium text-pisome-blue"
                onClick={() => setOpen(false)}
              >
                {t("nav.signIn")}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
