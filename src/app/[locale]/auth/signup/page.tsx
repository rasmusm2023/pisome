import { Link } from "@/i18n/navigation";
import { ArrowRight, Building2, Home } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function SignUpChooserPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");
  const tNav = await getTranslations("nav");

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-4xl flex-col justify-center px-4 py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pisome-muted">
        {t("chooseEyebrow")}
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-pisome-navy sm:text-4xl">
        {t("chooseTitle")}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-pisome-muted sm:text-base">
        {t("chooseSubtitle")}
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-6">
        <Link
          href="/auth/signup/private"
          className="group flex min-h-64 flex-col rounded-2xl border border-pisome-border bg-white p-7 text-left shadow-sm transition hover:border-pisome-blue hover:shadow-md hover:shadow-pisome-blue/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pisome-blue/30"
        >
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-pisome-alice text-pisome-blue">
            <Home className="h-6 w-6" aria-hidden />
          </span>
          <h2 className="mt-5 font-display text-2xl font-semibold text-pisome-navy">
            {t("choosePrivateTitle")}
          </h2>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-pisome-muted">
            {t("choosePrivateBody")}
          </p>
          <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-pisome-blue-dark group-hover:text-pisome-navy">
            {t("chooseContinue")}
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </Link>

        <Link
          href="/agent/join"
          className="group flex min-h-64 flex-col rounded-2xl border border-pisome-navy bg-[#081628] p-7 text-left text-white shadow-sm transition hover:bg-[#0b1f3a] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white">
            <Building2 className="h-6 w-6" aria-hidden />
          </span>
          <h2 className="mt-5 font-display text-2xl font-semibold">
            {t("chooseAgentTitle")}
          </h2>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-white/70">
            {t("chooseAgentBody")}
          </p>
          <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white group-hover:text-white">
            {t("chooseContinue")}
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>

      <p className="mt-8 text-sm text-pisome-muted">
        {t("haveAccount")}{" "}
        <Link
          href="/auth/signin"
          className="font-medium text-pisome-blue-dark hover:text-pisome-navy"
        >
          {tNav("signIn")}
        </Link>
      </p>
    </div>
  );
}
