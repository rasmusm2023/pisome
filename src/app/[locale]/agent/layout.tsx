import { auth } from "@/lib/auth";
import { Link } from "@/i18n/navigation";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function AgentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();
  const t = await getTranslations("agent");

  if (!session?.user) {
    redirect(`/${locale}/auth/signin`);
  }

  const isAgent =
    session.user.role === "AGENT" || session.user.role === "ADMIN";

  return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
      {isAgent && (
        <nav className="mb-6 flex flex-wrap gap-2 border-b border-pisome-border pb-4">
          {[
            { href: "/agent", label: t("dashboard") },
            { href: "/agent/listings/new", label: t("newListing") },
            { href: "/agent/inquiries", label: t("inquiries") },
            { href: "/agent/packages", label: t("packages") },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-pisome-muted hover:bg-pisome-alice hover:text-pisome-navy"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
      {children}
    </div>
  );
}
