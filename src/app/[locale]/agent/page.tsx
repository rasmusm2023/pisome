import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
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
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/auth/signin`);

  if (session.user.role !== "AGENT" && session.user.role !== "ADMIN") {
    return (
      <div className="rounded-2xl border border-pisome-border bg-white p-8">
        <h1 className="font-display text-2xl font-semibold text-pisome-navy">
          {t("cta.listHome")}
        </h1>
        <p className="mt-3 max-w-lg text-pisome-muted">
          {locale === "en"
            ? "Sign in with the demo agent account (agent@pisome.es) to access the publishing workspace."
            : "Entra con la cuenta demo de agente (agent@pisome.es) para acceder al espacio de publicación."}
        </p>
        <Link href="/auth/signin" className="mt-6 inline-block">
          <Button>{t("nav.signIn")}</Button>
        </Link>
      </div>
    );
  }

  const listings = await prisma.listing.findMany({
    where: { agentId: session.user.id },
    include: {
      media: { orderBy: { sortOrder: "asc" }, take: 1 },
      _count: { select: { inquiries: true, savedHomes: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const newInquiries = await prisma.inquiry.count({
    where: { agentId: session.user.id, status: "NEW" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-pisome-navy">
            {t("agent.dashboard")}
          </h1>
          <p className="mt-1 text-sm text-pisome-muted">
            {t("agent.leads")}: {newInquiries} new · {t("agent.replySla")}
          </p>
        </div>
        <Link href="/agent/listings/new">
          <Button variant="accent">{t("agent.newListing")}</Button>
        </Link>
      </div>

      {listings.length === 0 ? (
        <p className="mt-10 text-pisome-muted">{t("agent.noListings")}</p>
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
                    {listing.views} views · {listing._count.savedHomes} saves ·{" "}
                    {listing._count.inquiries} leads
                  </td>
                  <td className="px-4 py-4 text-right">
                    {listing.status === "LIVE" && (
                      <Link
                        href={`/listings/${listing.slug}`}
                        className="text-pisome-blue hover:underline"
                      >
                        View
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
