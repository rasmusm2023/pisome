"use client";

import { AuthConfigMissing } from "@/components/auth/auth-config-missing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInputRow } from "@/components/ui/phone-country-field";
import { Select } from "@/components/ui/select";
import { readSignupPhone } from "@/lib/phone";
import { Link, useRouter } from "@/i18n/navigation";
import { isSupabaseConfigured, createSupabaseBrowserClient } from "@/lib/supabase/client";
import { LAUNCH_CITIES } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

export default function PrivateSignUpPage() {
  const t = useTranslations("auth");
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cityChoice, setCityChoice] = useState("");

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
    const citySelect = String(form.get("citySelect") ?? "");
    const cityOther = String(form.get("cityOther") ?? "").trim();
    const city = citySelect === "other" ? cityOther : citySelect;
    const intent = String(form.get("intent") ?? "");
    const confirmPrivate = form.get("confirmPrivate") === "on";

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
    if (!city) {
      setError(t("cityRequired"));
      return;
    }
    if (!confirmPrivate) {
      setError(t("confirmPrivateRequired"));
      return;
    }

    setLoading(true);
    setError(null);

    const registerRes = await fetch("/api/auth/register", {
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
        city,
        intent,
        locale,
        confirmPrivate,
      }),
    });
    const registerBody = (await registerRes.json().catch(() => ({}))) as {
      error?: string;
      created?: boolean;
      alreadySignedIn?: boolean;
      alreadyAgent?: boolean;
    };

    if (!registerRes.ok) {
      setLoading(false);
      if (registerBody.error === "email_taken") {
        setError(t("signUpError"));
        return;
      }
      if (registerBody.error === "email_mismatch") {
        setError(t("emailMismatch"));
        return;
      }
      if (registerBody.error === "password_mismatch") {
        setError(t("passwordMismatch"));
        return;
      }
      setError(t("signUpError"));
      return;
    }

    if (registerBody.alreadyAgent) {
      setLoading(false);
      router.push("/agent");
      router.refresh();
      return;
    }

    if (registerBody.alreadySignedIn) {
      setLoading(false);
      router.push("/account");
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
      router.push("/auth/signin?callbackUrl=/account");
      return;
    }
    router.push("/account");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center px-4 py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pisome-muted">
        {t("choosePrivateTitle")}
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold text-pisome-navy">
        {t("privateTitle")}
      </h1>
      <p className="mt-2 text-sm text-pisome-muted">{t("privateSubtitle")}</p>
      <AuthConfigMissing />
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
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
        <Select
          name="citySelect"
          required
          autoComplete="address-level2"
          label={t("city")}
          value={cityChoice}
          onChange={(e) => setCityChoice(e.target.value)}
        >
          <option value="">{t("cityPlaceholder")}</option>
          {LAUNCH_CITIES.map((city) => (
            <option key={city.slug} value={city.name}>
              {locale === "en" ? city.nameEn : city.name}
            </option>
          ))}
          <option value="other">{t("cityOther")}</option>
        </Select>
        {cityChoice === "other" ? (
          <Input
            name="cityOther"
            type="text"
            required
            autoComplete="address-level2"
            label={t("cityOtherLabel")}
          />
        ) : null}
        <Select name="intent" required label={t("intent")}>
          <option value="">{t("intentPlaceholder")}</option>
          <option value="BUY">{t("intentBuy")}</option>
          <option value="SELL">{t("intentSell")}</option>
          <option value="BOTH">{t("intentBoth")}</option>
        </Select>
        <label className="flex items-start gap-3 rounded-xl border border-pisome-border bg-pisome-alice/40 px-3.5 py-3 text-sm text-pisome-navy">
          <input
            name="confirmPrivate"
            type="checkbox"
            required
            className="mt-0.5 accent-pisome-blue"
          />
          <span>{t("confirmPrivate")}</span>
        </label>
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
