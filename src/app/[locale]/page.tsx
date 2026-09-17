import { HomeListingTile } from "@/components/home/home-listing-tile";
import { HomeSearch } from "@/components/home/home-search";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import {
  getFilterCatalog,
  getMarketplacePulse,
  searchListings,
} from "@/lib/listings";
import { LAUNCH_CITIES } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=2400&q=80";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const [catalog, pulse, latest] = await Promise.all([
    getFilterCatalog(),
    getMarketplacePulse(),
    searchListings({ sort: "featured", take: 8 }),
  ]);

  return (
    <div>
      <section className="relative isolate -mt-16 min-h-[calc(100svh-13.5rem)]">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={HERO_IMAGE}
            alt=""
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-pisome-navy via-pisome-navy/55 to-pisome-navy/25" />
        </div>
        <div className="relative flex min-h-[calc(100svh-13.5rem)] items-center justify-center px-4 pb-10 pt-24 sm:px-6 lg:px-8">
          <div className="w-full max-w-2xl text-left">
            <p className="text-sm font-semibold text-white/75">
              {t("home.homesForSale", { count: pulse.total })}
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-white sm:text-6xl">
              {t("home.headline")}
            </h1>
            <p className="mt-3 max-w-xl text-base text-white/80 sm:text-lg">
              {t("home.searchHint")}
            </p>
            <div className="mt-8">
              <HomeSearch catalog={catalog} />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-12 pt-8 sm:px-6 sm:pb-16 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold text-pisome-navy">
            {t("home.cities")}
          </h2>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {LAUNCH_CITIES.map((city) => {
            const count = pulse.byCity[city.name] ?? 0;
            return (
              <Link
                key={city.slug}
                href={`/search?city=${encodeURIComponent(city.name)}`}
                className="group relative aspect-[4/5] overflow-hidden rounded-2xl sm:aspect-[5/4] lg:aspect-[4/5]"
              >
                <Image
                  src={city.image}
                  alt={locale === "en" ? city.nameEn : city.name}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="font-display text-xl font-semibold text-white">
                    {locale === "en" ? city.nameEn : city.name}
                  </p>
                  <p className="text-sm text-white/80">
                    {t("home.inCity", { count })}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-t border-pisome-border bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold text-pisome-navy">
            {t("home.latest")}
          </h2>
          <Link
            href="/search"
            className="inline-flex items-center gap-1 text-sm font-semibold text-pisome-blue hover:text-pisome-blue-dark"
          >
            {t("home.seeAll")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {latest.map((listing, index) => (
            <HomeListingTile
              key={listing.id}
              listing={listing}
              priority={index < 4}
            />
          ))}
        </div>
      </section>

      <section className="bg-pisome-navy px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-2xl font-semibold text-white">
              {t("home.sellTitle")}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-white/70">
              {t("home.sellBody")}
            </p>
          </div>
          <Link href="/agent">
            <Button size="lg" variant="primary">
              {t("cta.listHome")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
