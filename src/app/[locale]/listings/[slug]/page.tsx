import { InquiryForm } from "@/components/listings/inquiry-form";
import { ListingGallery } from "@/components/listings/listing-gallery";
import { ListingMap } from "@/components/listings/listing-map";
import { ListingToolbar } from "@/components/listings/listing-toolbar";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import { getListingBySlug, getPriceContext } from "@/lib/listings";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
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
  const title = listing.address;
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

  const photoCount = listing.media.filter((m) => !m.isFloorPlan).length;

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8">
      <ListingToolbar
        listingId={listing.id}
        address={title}
        initialSaved={Boolean(saved)}
        hasThumbs={photoCount > 1}
      />
      <ListingGallery
        media={listing.media}
        address={title}
        price={listing.price}
        neighborhood={listing.neighborhood}
        city={listing.city}
        rooms={listing.rooms}
        bathrooms={listing.bathrooms}
        areaM2={listing.areaM2}
      />

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-8">
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
            <Badge variant="default">
              {t("listing.energy", { cert: listing.energyCert })}
            </Badge>
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

          <section>
            <h2 className="font-display text-xl font-semibold text-pisome-navy">
              {t("listing.location")}
            </h2>
            <p className="mt-1 text-sm text-pisome-muted">
              {listing.address} · {listing.neighborhood}, {listing.city}
            </p>
            <div className="mt-4">
              <ListingMap
                lat={listing.lat}
                lng={listing.lng}
                address={listing.address}
              />
            </div>
          </section>

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
                      ? "text-pisome-blue"
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
          <div
            id="contact-broker"
            className="scroll-mt-28 rounded-2xl border border-pisome-border bg-white p-5"
          >
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
