"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/navigation";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function SignInPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError(true);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="font-display text-3xl font-semibold text-pisome-navy">
        {t("title")}
      </h1>
      <p className="mt-2 text-sm text-pisome-muted">{t("demoHint")}</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Input
          name="email"
          type="email"
          required
          placeholder={t("email")}
          defaultValue="seeker@pisome.es"
        />
        <Input
          name="password"
          type="password"
          required
          placeholder={t("password")}
          defaultValue="pisome123"
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {t("submit")}
        </Button>
        {error && <p className="text-sm text-red-600">{t("error")}</p>}
      </form>
    </div>
  );
}
