"use client";

import { Logo } from "@/components/brand/logo";
import { Link, usePathname } from "@/i18n/navigation";
import { LAUNCH_CITIES } from "@/lib/utils";
import { Mail } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

const BUY_TYPES = ["APARTMENT", "HOUSE", "VILLA", "PENTHOUSE"] as const;

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm text-white/70 transition hover:text-white"
    >
      {children}
    </Link>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <nav aria-label={title}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
        {title}
      </p>
      <ul className="mt-4 flex flex-col gap-2.5">{children}</ul>
    </nav>
  );
}

export function SiteFooter() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const year = new Date().getFullYear();
  const email = t("footer.email");

  return (
    <footer className="mt-auto border-t border-white/10 bg-[#081628] text-white">
      <div className="px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-12 md:gap-y-12">
          <div className="col-span-2 max-w-sm md:col-span-12 lg:col-span-4">
            <Link href="/" className="inline-flex">
              <Logo inverted />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              {t("footer.blurb")}
            </p>
            <a
              href={`mailto:${email}`}
              className="mt-5 inline-flex items-center gap-2 text-sm text-white/70 transition hover:text-white"
            >
              <Mail className="h-4 w-4 shrink-0" aria-hidden />
              {email}
            </a>
          </div>

          <div className="md:col-span-3 lg:col-span-2">
            <FooterColumn title={t("footer.buy")}>
              <li>
                <FooterLink href="/search">{t("footer.allHomes")}</FooterLink>
              </li>
              {BUY_TYPES.map((type) => (
                <li key={type}>
                  <FooterLink href={`/search?propertyTypes=${type}`}>
                    {t(`propertyTypes.${type}`)}
                  </FooterLink>
                </li>
              ))}
            </FooterColumn>
          </div>

          <div className="md:col-span-3 lg:col-span-2">
            <FooterColumn title={t("footer.sell")}>
              <li>
                <FooterLink href="/agent/listings/new">
                  {t("cta.listHome")}
                </FooterLink>
              </li>
              <li>
                <FooterLink href="/agent/packages">
                  {t("footer.packages")}
                </FooterLink>
              </li>
              <li>
                <FooterLink href="/agent">{t("nav.agent")}</FooterLink>
              </li>
            </FooterColumn>
          </div>

          <div className="md:col-span-3 lg:col-span-2">
            <FooterColumn title={t("footer.account")}>
              <li>
                <FooterLink href="/saved">{t("nav.saved")}</FooterLink>
              </li>
              <li>
                <FooterLink href="/auth/signin">{t("nav.signIn")}</FooterLink>
              </li>
              <li>
                <FooterLink href="/auth/signup">{t("nav.signUp")}</FooterLink>
              </li>
            </FooterColumn>
          </div>

          <div className="md:col-span-3 lg:col-span-2">
            <FooterColumn title={t("footer.cities")}>
              {LAUNCH_CITIES.map((city) => (
                <li key={city.slug}>
                  <FooterLink
                    href={`/search?city=${encodeURIComponent(city.name)}`}
                  >
                    {locale === "en" ? city.nameEn : city.name}
                  </FooterLink>
                </li>
              ))}
            </FooterColumn>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/45">{t("footer.rights", { year })}</p>
          <div
            className="flex items-center gap-1"
            role="group"
            aria-label={t("footer.language")}
          >
            {(["es", "en"] as const).map((loc) => (
              <Link
                key={loc}
                href={pathname}
                locale={loc}
                className={
                  locale === loc
                    ? "rounded-md bg-white/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-white"
                    : "rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-white/50 transition hover:bg-white/10 hover:text-white"
                }
              >
                {loc}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
