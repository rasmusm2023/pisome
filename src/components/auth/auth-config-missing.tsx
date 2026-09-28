"use client";

import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";

export function AuthConfigMissing() {
  const t = useTranslations("auth");
  if (isSupabaseConfigured()) return null;
  return (
    <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
      {t("missingConfig")}
    </p>
  );
}
