import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { formatPrice } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

export default async function AgentDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/auth/signin?callbackUrl=/agent`);

  const unlocked = user.subscribed;
  const [listings, newInquiries, savedCount] = unlocked
    ? await Promise.all([
        prisma.listing.findMany({
          where: { agentId: user.id },
          include: {
            media: { orderBy: { sortOrder: "asc" }, take: 1 },
            _count: { select: { inquiries: true, savedHomes: true } },
          },
          orderBy: { updatedAt: "desc" },
        }),
        prisma.inquiry.count({
          where: { agentId: user.id, status: "NEW" },
        }),
        prisma.savedHome.count({
          where: { listing: { agentId: user.id } },
        }),
      ])
    : [[], 0, 0] as const;

  const totalViews = listings.reduce((sum, listing) => sum + listing.views, 0);
  const stat = (value: number) => (unlocked ? value : "—");

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-pisome-navy">
            {t("agent.dashboard")}
          </h1>
          <p className="mt-1 text-sm text-pisome-muted">
            {t("agent.welcome", { name: user.name })}
          </p>
        </div>
        <Link href={unlocked ? "/agent/listings/new" : "/agent/packages"}>
          <Button variant="accent">
            {unlocked ? t("agent.newListing") : t("agent.choosePlan")}
          </Button>
        </Link>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-pisome-border bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-pisome-muted">
            {t("agent.leads")}
          </p>
          <p className="mt-2 font-display text-3xl font-semibold text-pisome-navy">
            {stat(newInquiries)}
          </p>
          <p className="mt-1 text-sm text-pisome-muted">{t("agent.replySla")}</p>
        </div>
        <div className="rounded-2xl border border-pisome-border bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-pisome-muted">
            {t("agent.viewsLabel")}
          </p>
          <p className="mt-2 font-display text-3xl font-semibold text-pisome-navy">
            {stat(totalViews)}
          </p>
        </div>
        <div className="rounded-2xl border border-pisome-border bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-pisome-muted">
            {t("nav.saved")}
          </p>
          <p className="mt-2 font-display text-3xl font-semibold text-pisome-navy">
            {stat(savedCount)}
          </p>
        </div>
      </div>

      {listings.length === 0 ? (
        <p className="mt-10 text-pisome-muted">
          {unlocked ? t("agent.noListings") : t("agent.paywallListings")}
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-pisome-border bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-pisome-border bg-pisome-alice/50 text-pisome-muted">
              <tr>
                <th className="px-4 py-3 font-medium">{t("agent.listings")}</th>
                <th className="px-4 py-3 font-medium">{t("agent.status")}</th>
                <th className="px-4 py-3 font-medium">{t("agent.performance")}</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr
                  key={listing.id}
                  className="border-b border-pisome-border/70 last:border-0"
                >
                  <td className="px-4 py-4">
                    <p className="font-medium text-pisome-navy">{listing.address}</p>
                    <p className="text-pisome-muted">
                      {formatPrice(
                        listing.price,
                        locale === "en" ? "en-GB" : "es-ES",
                      )}{" "}
                      · {listing.city}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <Badge>{t(`status.${listing.status}`)}</Badge>
                    <div className="mt-1">
                      <Badge
                        variant={
                          listing.packageTier === "PREMIUM"
                            ? "premium"
                            : listing.packageTier === "PLUS"
                              ? "plus"
                              : "default"
                        }
                      >
                        {listing.packageTier}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-pisome-muted">
                    {listing.views} {t("agent.viewsShort")} ·{" "}
                    {listing._count.savedHomes} {t("agent.savesShort")} ·{" "}
                    {listing._count.inquiries} {t("agent.leadsShort")}
                  </td>
                  <td className="px-4 py-4 text-right">
                    {listing.status === "LIVE" && (
                      <Link
                        href={`/listings/${listing.slug}`}
                        className="text-pisome-blue-dark hover:underline"
                      >
                        {t("cta.viewListing")}
                      </Link>
                    )}
                    <Link
                      href={`/agent/packages?listingId=${listing.id}`}
                      className="ml-3 text-pisome-accent hover:underline"
                    >
                      {t("cta.upgrade")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
