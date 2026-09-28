import { ListingCard } from "@/components/listings/listing-card";
import { prisma } from "@/lib/db";
import { parseDrawnArea } from "@/lib/geo";
import { searchHrefFromSavedSearch } from "@/lib/saved-search";
import { getSessionUser } from "@/lib/session";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/auth/signin?callbackUrl=/account`);

  if (user.role === "AGENT" || user.role === "ADMIN") {
    redirect(`/${locale}/agent`);
  }

  const [saved, alerts, inquiries] = await Promise.all([
    prisma.savedHome.findMany({
      where: { userId: user.id },
      include: {
        listing: {
          include: { media: { orderBy: { sortOrder: "asc" }, take: 5 } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.savedSearch.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.inquiry.findMany({
      where: { senderId: user.id },
      include: {
        listing: { select: { title: true, slug: true, address: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const openInquiries = inquiries.filter((item) => item.status !== "CLOSED").length;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold text-pisome-navy">
        {t("account.title")}
      </h1>
      <p className="mt-1 text-sm text-pisome-muted">
        {t("account.hello", { name: user.name })}
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-pisome-border bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-pisome-muted">
            {t("nav.saved")}
          </p>
          <p className="mt-2 font-display text-3xl font-semibold text-pisome-navy">
            {saved.length}
          </p>
        </div>
        <div className="rounded-2xl border border-pisome-border bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-pisome-muted">
            {t("saved.alerts")}
          </p>
          <p className="mt-2 font-display text-3xl font-semibold text-pisome-navy">
            {alerts.length}
          </p>
        </div>
        <div className="rounded-2xl border border-pisome-border bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-pisome-muted">
            {t("account.openInquiries")}
          </p>
          <p className="mt-2 font-display text-3xl font-semibold text-pisome-navy">
            {openInquiries}
          </p>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold text-pisome-navy">
          {t("saved.title")}
        </h2>
        {saved.length === 0 ? (
          <p className="mt-4 text-pisome-muted">
            {t("saved.empty")}{" "}
            <Link href="/search" className="text-pisome-blue-dark underline">
              {t("nav.search")}
            </Link>
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((s) => (
              <ListingCard key={s.id} listing={s.listing} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-14">
        <h2 className="font-display text-xl font-semibold text-pisome-navy">
          {t("saved.alerts")}
        </h2>
        {alerts.length === 0 ? (
          <p className="mt-3 text-sm text-pisome-muted">{t("saved.alertsEmpty")}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {alerts.map((a) => {
              const hasMapArea = Boolean(parseDrawnArea(a.drawnArea));
              return (
                <li
                  key={a.id}
                  className="rounded-xl border border-pisome-border bg-white px-4 py-3 text-sm"
                >
                  <Link
                    href={searchHrefFromSavedSearch(a)}
                    className="font-medium text-pisome-navy hover:underline"
                    title={t("saved.openSearch")}
                  >
                    {a.name}
                  </Link>
                  {a.city && a.city !== a.name && (
                    <span className="text-pisome-muted"> · {a.city}</span>
                  )}
                  {hasMapArea && a.name !== t("search.mapArea") && (
                    <span className="text-pisome-muted">
                      {" "}
                      · {t("search.mapArea")}
                    </span>
                  )}
                  {a.alertsOn && (
                    <span className="ml-2 text-pisome-success">● live</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-14">
        <h2 className="font-display text-xl font-semibold text-pisome-navy">
          {t("account.inquiries")}
        </h2>
        {inquiries.length === 0 ? (
          <p className="mt-3 text-sm text-pisome-muted">{t("account.inquiriesEmpty")}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {inquiries.map((inq) => (
              <li
                key={inq.id}
                className="rounded-xl border border-pisome-border bg-white px-4 py-3 text-sm"
              >
                <Link
                  href={`/listings/${inq.listing.slug}`}
                  className="font-medium text-pisome-navy hover:underline"
                >
                  {inq.listing.address}
                </Link>
                <span className="text-pisome-muted"> · {inq.status}</span>
                <p className="mt-1 line-clamp-2 text-pisome-muted">{inq.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
