"use client";

import { AuthConfigMissing } from "@/components/auth/auth-config-missing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useRouter } from "@/i18n/navigation";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function PrivateSignUpPage() {
  const t = useTranslations("auth");
  const tNav = useTranslations("nav");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      setError(t("missingConfig"));
      return;
    }
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "");
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    const supabase = createSupabaseBrowserClient();
    const { data, error: signError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (signError) {
      setLoading(false);
      setError(signError.message);
      return;
    }

    if (!data.session) {
      setLoading(false);
      setError(t("confirmEmail"));
      return;
    }

    setLoading(false);
    router.push("/account");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pisome-muted">
        {t("choosePrivateTitle")}
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold text-pisome-navy">
        {t("privateTitle")}
      </h1>
      <p className="mt-2 text-sm text-pisome-muted">{t("privateSubtitle")}</p>
      <AuthConfigMissing />
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Input
          name="name"
          type="text"
          required
          autoComplete="name"
          label={t("name")}
        />
        <Input
          name="email"
          type="email"
          required
          autoComplete="email"
          label={t("email")}
        />
        <Input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          label={t("password")}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {t("signUpSubmit")}
        </Button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
      <p className="mt-6 text-sm text-pisome-muted">
        {t("haveAccount")}{" "}
        <Link
          href="/auth/signin"
          className="font-medium text-pisome-blue-dark hover:text-pisome-navy"
        >
          {tNav("signIn")}
        </Link>
      </p>
      <p className="mt-2 text-sm text-pisome-muted">
        <Link
          href="/auth/signup"
          className="font-medium text-pisome-blue-dark hover:text-pisome-navy"
        >
          {t("chooseBack")}
        </Link>
      </p>
    </div>
  );
}
