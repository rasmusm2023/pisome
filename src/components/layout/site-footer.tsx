import { Logo } from "@/components/brand/logo";
import { getTranslations } from "next-intl/server";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-pisome-border bg-white">
      <div className="flex flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <Logo />
        <p className="text-sm text-pisome-muted">{t("rights", { year })}</p>
      </div>
    </footer>
  );
}
