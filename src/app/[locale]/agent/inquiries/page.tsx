import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { MarkInquiryButton } from "@/components/agent/mark-inquiry-button";

export default async function InquiriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("agent");
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/auth/signin`);
  if (session.user.role !== "AGENT" && session.user.role !== "ADMIN") {
    redirect(`/${locale}/agent`);
  }

  const inquiries = await prisma.inquiry.findMany({
    where: {
      OR: [{ agentId: session.user.id }, { listing: { agentId: session.user.id } }],
    },
    include: {
      listing: { select: { title: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-pisome-navy">
        {t("inquiries")}
      </h1>
      <p className="mt-1 text-sm text-pisome-muted">{t("replySla")}</p>

      {inquiries.length === 0 ? (
        <p className="mt-8 text-pisome-muted">{t("noInquiries")}</p>
      ) : (
        <ul className="mt-8 space-y-3">
          {inquiries.map((inq) => (
            <li
              key={inq.id}
              className="rounded-2xl border border-pisome-border bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={inq.status === "NEW" ? "featured" : "default"}
                    >
                      {inq.status}
                    </Badge>
                    <p className="font-medium text-pisome-navy">{inq.name}</p>
                  </div>
                  <p className="mt-1 text-sm text-pisome-muted">
                    {inq.email}
                    {inq.phone ? ` · ${inq.phone}` : ""} · {inq.listing.title}
                  </p>
                  <p className="mt-3 text-sm text-pisome-navy">{inq.message}</p>
                </div>
                {inq.status === "NEW" && (
                  <MarkInquiryButton id={inq.id} status="READ" />
                )}
                {inq.status === "READ" && (
                  <MarkInquiryButton id={inq.id} status="REPLIED" />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
