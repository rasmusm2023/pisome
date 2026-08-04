"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useRouter } from "@/i18n/navigation";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function SignUpPage() {
  const t = useTranslations("auth");
  const tNav = useTranslations("nav");
  const router = useRouter();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "");
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      setLoading(false);
      setError(true);
      return;
    }

    const signedIn = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (signedIn?.error) {
      router.push("/auth/signin");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="font-display text-3xl font-semibold text-pisome-navy">
        {t("signUpTitle")}
      </h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Input
          name="name"
          type="text"
          required
          autoComplete="name"
          placeholder={t("name")}
        />
        <Input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={t("email")}
        />
        <Input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          placeholder={t("password")}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {t("signUpSubmit")}
        </Button>
        {error && <p className="text-sm text-red-600">{t("signUpError")}</p>}
      </form>
      <p className="mt-6 text-sm text-pisome-muted">
        {t("haveAccount")}{" "}
        <Link
          href="/auth/signin"
          className="font-medium text-pisome-blue hover:text-pisome-blue-dark"
        >
          {tNav("signIn")}
        </Link>
      </p>
    </div>
  );
}
