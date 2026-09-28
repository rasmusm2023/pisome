"use client";

import { AuthConfigMissing } from "@/components/auth/auth-config-missing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useRouter } from "@/i18n/navigation";
import { pathAfterLogin } from "@/lib/auth-redirect";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Role } from "@/lib/types";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}

function SignInForm() {
  const t = useTranslations("auth");
  const tNav = useTranslations("nav");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function fetchRole(): Promise<Role> {
    const res = await fetch("/api/me");
    if (!res.ok) return "SEEKER";
    const body = (await res.json()) as { role?: Role };
    return body.role === "AGENT" || body.role === "ADMIN" ? body.role : "SEEKER";
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      setError(true);
      return;
    }
    setLoading(true);
    setError(false);
    const form = new FormData(e.currentTarget);
    const supabase = createSupabaseBrowserClient();
    const { data, error: signError } = await supabase.auth.signInWithPassword({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });
    setLoading(false);
    if (signError || !data.user) {
      setError(true);
      return;
    }

    const next = pathAfterLogin(await fetchRole(), searchParams.get("callbackUrl"));
    router.push(next);
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="font-display text-3xl font-semibold text-pisome-navy">
        {t("title")}
      </h1>
      <p className="mt-2 text-sm text-pisome-muted">{t("demoHint")}</p>
      <AuthConfigMissing />
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
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
          autoComplete="current-password"
          label={t("password")}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {t("submit")}
        </Button>
        {error && <p className="text-sm text-red-600">{t("error")}</p>}
      </form>
      <p className="mt-6 text-sm text-pisome-muted">
        {t("needAccount")}{" "}
        <Link
          href="/auth/signup"
          className="font-medium text-pisome-blue-dark hover:text-pisome-navy"
        >
          {tNav("signUp")}
        </Link>
      </p>
    </div>
  );
}
