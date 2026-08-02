"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function InquiryForm({
  listingId,
  defaultName,
  defaultEmail,
}: {
  listingId: string;
  defaultName?: string;
  defaultEmail?: string;
}) {
  const t = useTranslations();
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId,
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone"),
        message: form.get("message"),
      }),
    });
    setLoading(false);
    setStatus(res.ok ? "ok" : "error");
    if (res.ok) e.currentTarget.reset();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <h3 className="font-display text-lg font-semibold text-pisome-navy">
        {t("listing.inquire")}
      </h3>
      <Input
        id="inquiry-name"
        name="name"
        required
        placeholder={t("inquiry.name")}
        defaultValue={defaultName}
      />
      <Input
        name="email"
        type="email"
        required
        placeholder={t("inquiry.email")}
        defaultValue={defaultEmail}
      />
      <Input name="phone" placeholder={t("inquiry.phone")} />
      <Textarea
        name="message"
        required
        defaultValue={t("inquiry.defaultMessage")}
      />
      <Button type="submit" className="w-full" disabled={loading}>
        {t("inquiry.send")}
      </Button>
      {status === "ok" && (
        <p className="text-sm text-pisome-success">{t("listing.inquireSuccess")}</p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-600">Error</p>
      )}
    </form>
  );
}
