"use client";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Heart, HousePlus, Menu, Search, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const otherLocale = locale === "es" ? "en" : "es";
  const inverted = overlay && !scrolled && !open;

  useEffect(() => {
    if (!overlay) {
      setScrolled(false);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 28);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overlay]);

  const links = [
    { href: "/search", label: t("nav.search"), icon: Search },
    { href: "/saved", label: t("nav.saved"), icon: Heart },
    { href: "/agent", label: t("nav.list"), icon: HousePlus },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-colors duration-300",
        inverted
          ? "border-b-0 bg-gradient-to-b from-black/55 to-transparent"
          : "border-b border-pisome-border/70 bg-white/90 backdrop-blur-md",
      )}
    >
      <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="col-start-1 justify-self-start"
          onClick={() => setOpen(false)}
        >
          <Logo inverted={inverted} />
        </Link>

        <nav className="col-start-2 hidden shrink-0 items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "inline-flex flex-row flex-nowrap items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition",
                inverted
                  ? "text-white/85 hover:bg-white/10 hover:text-white"
                  : "text-pisome-muted hover:bg-pisome-alice hover:text-pisome-navy",
                pathname.startsWith(link.href) &&
                  (inverted
                    ? "bg-white/15 text-white"
                    : "bg-pisome-alice text-pisome-navy"),
              )}
            >
              <link.icon className="h-4 w-4 shrink-0" aria-hidden />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="col-start-3 flex items-center justify-end gap-2 justify-self-end">
          <div className="hidden items-center gap-2 md:flex">
          <Link
            href={pathname}
            locale={otherLocale}
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider",
              inverted
                ? "text-white/80 hover:bg-white/10 hover:text-white"
                : "text-pisome-muted hover:bg-pisome-alice hover:text-pisome-navy",
            )}
          >
            {otherLocale}
          </Link>
          {session?.user ? (
            <>
              {(session.user.role === "AGENT" || session.user.role === "ADMIN") && (
                <Link href="/agent">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={inverted ? "text-white hover:bg-white/10" : undefined}
                  >
                    {t("nav.agent")}
                  </Button>
                </Link>
              )}
              <Link href="/saved" aria-label={t("nav.saved")}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={inverted ? "text-white hover:bg-white/10" : undefined}
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className={
                  inverted
                    ? "border-white/30 bg-white/10 text-white hover:bg-white/20"
                    : undefined
                }
                onClick={() => signOut()}
              >
                {t("nav.signOut")}
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/signin">
                <Button
                  variant="outline"
                  size="sm"
                  className={
                    inverted
                      ? "border-white/30 bg-white/10 text-white hover:bg-white/20"
                      : undefined
                  }
                >
                  {t("nav.signIn")}
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">{t("nav.signUp")}</Button>
              </Link>
            </>
          )}
          </div>

        <button
          className={cn(
            "rounded-lg p-2 md:hidden",
            inverted ? "text-white" : "text-pisome-navy",
          )}
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-pisome-border bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium text-pisome-navy hover:bg-pisome-alice"
                onClick={() => setOpen(false)}
              >
                <link.icon className="h-4 w-4 shrink-0" aria-hidden />
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
              <>
                <Link
                  href="/auth/signin"
                  className="rounded-lg px-3 py-3 text-sm font-medium text-pisome-navy"
                  onClick={() => setOpen(false)}
                >
                  {t("nav.signIn")}
                </Link>
                <Link
                  href="/auth/signup"
                  className="rounded-lg px-3 py-3 text-sm font-semibold text-pisome-blue-dark"
                  onClick={() => setOpen(false)}
                >
                  {t("nav.signUp")}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
