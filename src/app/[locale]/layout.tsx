import { Providers } from "@/components/providers";
import { AppShell } from "@/components/layout/app-shell";
import { SiteFooter } from "@/components/layout/site-footer";
import { routing } from "@/i18n/routing";
import { getSessionUser } from "@/lib/session";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const [messages, user] = await Promise.all([getMessages(), getSessionUser()]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Providers user={user}>
        <div lang={locale}>
          <AppShell footer={<SiteFooter />}>{children}</AppShell>
        </div>
      </Providers>
    </NextIntlClientProvider>
  );
}
