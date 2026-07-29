import { ListingCard } from "@/components/listings/listing-card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

export default async function SavedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/auth/signin`);

  const [saved, alerts] = await Promise.all([
    prisma.savedHome.findMany({
      where: { userId: session.user.id },
      include: {
        listing: {
          include: { media: { orderBy: { sortOrder: "asc" }, take: 5 } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.savedSearch.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold text-pisome-navy">
        {t("saved.title")}
      </h1>

      {saved.length === 0 ? (
        <p className="mt-6 text-pisome-muted">
          {t("saved.empty")}{" "}
          <Link href="/search" className="text-pisome-blue underline">
            {t("nav.search")}
          </Link>
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((s) => (
            <ListingCard key={s.id} listing={s.listing} />
          ))}
        </div>
      )}

      <section className="mt-14">
        <h2 className="font-display text-xl font-semibold text-pisome-navy">
          {t("saved.alerts")}
        </h2>
        {alerts.length === 0 ? (
          <p className="mt-3 text-sm text-pisome-muted">{t("saved.alertsEmpty")}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {alerts.map((a) => (
              <li
                key={a.id}
                className="rounded-xl border border-pisome-border bg-white px-4 py-3 text-sm"
              >
                <span className="font-medium text-pisome-navy">{a.name}</span>
                {a.city && (
                  <span className="text-pisome-muted"> · {a.city}</span>
                )}
                {a.alertsOn && (
                  <span className="ml-2 text-pisome-success">● live</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
