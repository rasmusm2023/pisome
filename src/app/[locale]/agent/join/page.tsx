"use client";

import { AuthConfigMissing } from "@/components/auth/auth-config-missing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useRouter } from "@/i18n/navigation";
import { PhoneInputRow } from "@/components/ui/phone-country-field";
import { readSignupPhone } from "@/lib/phone";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function AgentJoinPage() {
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

    const form = new FormData(e.currentTarget);
    const firstName = String(form.get("firstName") ?? "");
    const lastName = String(form.get("lastName") ?? "");
    const email = String(form.get("email") ?? "").trim();
    const emailConfirm = String(form.get("emailConfirm") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const passwordConfirm = String(form.get("passwordConfirm") ?? "");
    const phone = readSignupPhone(form);
    const agencyName = String(form.get("agencyName") ?? "");
    const city = String(form.get("city") ?? "");
    const licenseNumber = String(form.get("licenseNumber") ?? "");
    const confirmAgent = form.get("confirmAgent") === "on";

    if (email.toLowerCase() !== emailConfirm.toLowerCase()) {
      setError(t("emailMismatch"));
      return;
    }
    if (password !== passwordConfirm) {
      setError(t("passwordMismatch"));
      return;
    }
    if (!phone) {
      setError(t("phoneInvalid"));
      return;
    }
    if (!confirmAgent) {
      setError(t("confirmAgentRequired"));
      return;
    }

    setLoading(true);
    setError(null);

    const joinRes = await fetch("/api/auth/agent-join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        emailConfirm,
        password,
        passwordConfirm,
        phone,
        agencyName,
        city,
        licenseNumber,
        confirmAgent,
      }),
    });
    const joinBody = (await joinRes.json().catch(() => ({}))) as {
      error?: string;
      created?: boolean;
      upgraded?: boolean;
      alreadyAgent?: boolean;
    };

    if (!joinRes.ok) {
      setLoading(false);
      if (joinBody.error === "email_taken") {
        setError(t("signUpError"));
        return;
      }
      if (joinBody.error === "email_mismatch") {
        setError(t("emailMismatch"));
        return;
      }
      if (joinBody.error === "password_mismatch") {
        setError(t("passwordMismatch"));
        return;
      }
      setError(t("joinError"));
      return;
    }

    if (joinBody.upgraded || joinBody.alreadyAgent) {
      setLoading(false);
      router.push("/agent");
      router.refresh();
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { error: signError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signError) {
      router.push("/auth/signin?callbackUrl=/agent");
      return;
    }
    router.push("/agent");
    router.refresh();
  }

  return (
    <div className="bg-[#07111f] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div className="text-white lg:pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
            {t("agentProduct")}
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            {t("joinTitle")}
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/70">
            {t("joinSubtitle")}
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/80">
            <li>{t("joinPointListings")}</li>
            <li>{t("joinPointInbox")}</li>
            <li>{t("joinPointStats")}</li>
            <li>{t("joinPointVerify")}</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white p-6 shadow-xl sm:p-8">
          <h2 className="font-display text-2xl font-semibold text-pisome-navy">
            {t("joinFormTitle")}
          </h2>
          <p className="mt-2 text-sm text-pisome-muted">{t("joinHint")}</p>
          <AuthConfigMissing />
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                name="firstName"
                type="text"
                required
                autoComplete="given-name"
                label={t("firstName")}
              />
              <Input
                name="lastName"
                type="text"
                required
                autoComplete="family-name"
                label={t("lastName")}
              />
            </div>
            <Input
              name="email"
              type="email"
              required
              autoComplete="email"
              label={t("email")}
            />
            <Input
              name="emailConfirm"
              type="email"
              required
              autoComplete="email"
              label={t("emailConfirm")}
            />
            <Input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              label={t("password")}
            />
            <Input
              name="passwordConfirm"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              label={t("passwordConfirm")}
            />
            <PhoneInputRow phoneLabel={t("phone")} countryLabel={t("phoneCountry")} />
            <Input
              name="agencyName"
              type="text"
              required
              autoComplete="organization"
              label={t("agencyName")}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                name="city"
                type="text"
                required
                autoComplete="address-level2"
                label={t("city")}
              />
              <Input
                name="licenseNumber"
                type="text"
                required
                autoComplete="off"
                label={t("licenseNumber")}
              />
            </div>
            <label className="flex items-start gap-3 rounded-xl border border-pisome-border bg-pisome-alice/40 px-3.5 py-3 text-sm text-pisome-navy">
              <input
                name="confirmAgent"
                type="checkbox"
                required
                className="mt-0.5 accent-pisome-blue"
              />
              <span>{t("confirmAgent")}</span>
            </label>
            <Button type="submit" className="w-full" disabled={loading}>
              {t("joinSubmit")}
            </Button>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </form>
          <p className="mt-6 text-sm text-pisome-muted">
            {t("haveAccount")}{" "}
            <Link
              href="/auth/signin?callbackUrl=/agent"
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
      </div>
    </div>
  );
}
