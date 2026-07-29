import { InquiryForm } from "@/components/listings/inquiry-form";
import { ListingGallery } from "@/components/listings/listing-gallery";
import { SaveButton } from "@/components/listings/save-button";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import { getListingBySlug, getPriceContext } from "@/lib/listings";
import { prisma } from "@/lib/db";
import { formatPrice, formatPricePerM2 } from "@/lib/utils";
import { Bath, BedDouble, Maximize, Zap } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

export default async function ListingPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const listing = await getListingBySlug(slug);
  if (!listing || listing.status !== "LIVE") notFound();

  const session = await auth();
  const saved = session?.user?.id
    ? await prisma.savedHome.findUnique({
        where: {
          userId_listingId: {
            userId: session.user.id,
            listingId: listing.id,
          },
        },
      })
    : null;

  const priceContext = await getPriceContext(listing);
  const title =
    locale === "en" && listing.titleEn ? listing.titleEn : listing.title;
  const description =
    locale === "en" && listing.descriptionEn
      ? listing.descriptionEn
      : listing.description;
  const numberLocale = locale === "en" ? "en-GB" : "es-ES";

  const features = [
    listing.hasElevator && t("listing.elevator"),
    listing.hasParking && t("listing.parking"),
    listing.hasTerrace && t("listing.terrace"),
    listing.hasPool && t("listing.pool"),
  ].filter(Boolean) as string[];

  return (
      <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8">
      <ListingGallery media={listing.media} />

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-8">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {listing.featured && (
                <Badge variant="featured">{t("listing.featured")}</Badge>
              )}
              {listing.packageTier === "PLUS" && (
                <Badge variant="plus">{t("listing.plus")}</Badge>
              )}
              {listing.packageTier === "PREMIUM" && (
                <Badge variant="premium">{t("listing.premium")}</Badge>
              )}
              <Badge>{t(`propertyTypes.${listing.propertyType}`)}</Badge>
            </div>
            <p className="font-display text-3xl font-semibold text-pisome-navy sm:text-4xl">
              {formatPrice(listing.price, numberLocale)}
            </p>
            <h1 className="font-display text-2xl font-semibold text-pisome-navy">
              {title}
            </h1>
            <p className="text-pisome-muted">
              {listing.address} · {listing.neighborhood}, {listing.city}
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-sm text-pisome-navy">
              <span className="inline-flex items-center gap-1.5">
                <BedDouble className="h-4 w-4 text-pisome-blue" />
                {t("listing.rooms", { count: listing.rooms })}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Bath className="h-4 w-4 text-pisome-blue" />
                {t("listing.baths", { count: listing.bathrooms })}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Maximize className="h-4 w-4 text-pisome-blue" />
                {t("listing.area", { count: listing.areaM2 })}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-pisome-blue" />
                {t("listing.energy", { cert: listing.energyCert })}
              </span>
              <span>
                {formatPricePerM2(listing.price, listing.areaM2, numberLocale)}
              </span>
            </div>
            <div className="pt-2">
              <SaveButton listingId={listing.id} initialSaved={Boolean(saved)} />
            </div>
          </div>

          <section>
            <h2 className="font-display text-xl font-semibold text-pisome-navy">
              {t("listing.description")}
            </h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-pisome-muted">
              {description}
            </p>
          </section>

          {features.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-semibold text-pisome-navy">
                {t("listing.features")}
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {features.map((f) => (
                  <li
                    key={f}
                    className="rounded-lg bg-pisome-alice px-3 py-1.5 text-sm text-pisome-navy"
                  >
                    {f}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-2xl border border-pisome-border bg-white p-5">
            <h2 className="font-display text-xl font-semibold text-pisome-navy">
              {t("listing.priceContext")}
            </h2>
            <p className="mt-2 text-sm text-pisome-muted">
              {t("listing.priceContextBody", {
                neighborhood: listing.neighborhood,
                city: listing.city,
              })}
            </p>
            <div className="mt-4 flex flex-wrap gap-6">
              <div>
                <p className="text-xs uppercase tracking-wide text-pisome-muted">
                  €/m² área
                </p>
                <p className="font-display text-2xl font-semibold text-pisome-navy">
                  {formatPrice(priceContext.avgPricePerM2, numberLocale)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-pisome-muted">
                  vs área
                </p>
                <p
                  className={`font-display text-2xl font-semibold ${
                    priceContext.deltaPercent > 5
                      ? "text-pisome-accent"
                      : priceContext.deltaPercent < -5
                        ? "text-pisome-success"
                        : "text-pisome-navy"
                  }`}
                >
                  {priceContext.deltaPercent > 0 ? "+" : ""}
                  {priceContext.deltaPercent}%
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-pisome-border bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-pisome-muted">
              {t("listing.agent")}
            </p>
            <p className="mt-2 font-display text-lg font-semibold text-pisome-navy">
              {listing.agent?.name ?? listing.organization?.name ?? "Pisome"}
            </p>
            {listing.organization && (
              <p className="text-sm text-pisome-muted">
                {listing.organization.name}
              </p>
            )}
            <p className="mt-2 text-xs text-pisome-muted">
              {t("listing.views", { count: listing.views })}
            </p>
          </div>
          <div className="rounded-2xl border border-pisome-border bg-white p-5">
            <InquiryForm
              listingId={listing.id}
              defaultName={session?.user?.name}
              defaultEmail={session?.user?.email}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
