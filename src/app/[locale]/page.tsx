import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { LAUNCH_CITIES } from "@/lib/utils";
import { ArrowRight, Bell, ShieldCheck, Sparkles } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div>
      <section className="pisome-gradient relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1800&q=80)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            maskImage:
              "linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.15) 55%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.15) 55%, transparent)",
          }}
        />
        <div className="relative flex min-h-[78vh] flex-col justify-center px-4 py-20 sm:px-6 lg:px-8">
          <p className="animate-fade-up font-display text-5xl font-bold tracking-tight text-pisome-navy sm:text-7xl">
            {t("brand")}
          </p>
          <h1 className="animate-fade-up mt-4 max-w-2xl font-display text-2xl font-semibold text-pisome-navy/90 sm:text-4xl" style={{ animationDelay: "80ms" }}>
            {t("tagline")}
          </h1>
          <p className="animate-fade-up mt-4 max-w-xl text-base text-pisome-muted sm:text-lg" style={{ animationDelay: "140ms" }}>
            {t("heroSubtitle")}
          </p>
          <div className="animate-fade-up mt-8 flex flex-wrap gap-3" style={{ animationDelay: "200ms" }}>
            <Link href="/search">
              <Button size="lg" variant="accent">
                {t("cta.searchHomes")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/agent">
              <Button size="lg" variant="outline">
                {t("cta.listHome")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl font-semibold text-pisome-navy">
          {t("home.cities")}
        </h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
          {LAUNCH_CITIES.map((city) => (
            <Link
              key={city.slug}
              href={`/search?city=${encodeURIComponent(city.name)}`}
              className="rounded-2xl border border-pisome-border bg-white px-5 py-6 transition hover:-translate-y-0.5 hover:border-pisome-blue hover:shadow-md"
            >
              <p className="font-display text-xl font-semibold text-pisome-navy">
                {locale === "en" ? city.nameEn : city.name}
              </p>
              <p className="mt-1 text-sm text-pisome-muted">
                {t("cta.searchHomes")} →
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-pisome-border bg-white">
        <div className="px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-semibold text-pisome-navy">
            {t("home.why")}
          </h2>
          <div className="mt-8 grid gap-8 md:grid-cols-3 xl:grid-cols-3 xl:gap-12">
            {[
              {
                icon: Sparkles,
                title: t("home.whyClarity"),
                body: t("home.whyClarityBody"),
              },
              {
                icon: Bell,
                title: t("home.whySpeed"),
                body: t("home.whySpeedBody"),
              },
              {
                icon: ShieldCheck,
                title: t("home.whyTrust"),
                body: t("home.whyTrustBody"),
              },
            ].map((item) => (
              <div key={item.title} className="space-y-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-pisome-alice text-pisome-blue">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold text-pisome-navy">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-pisome-muted">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-sm text-pisome-muted">{t("home.comingRent")}</p>
        </div>
      </section>
    </div>
  );
}
