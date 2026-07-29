"use client";

import { Button } from "@/components/ui/button";
import { PACKAGE_PRICES } from "@/lib/packages";
import type { PackageTier } from "@/lib/types";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

const tiers: PackageTier[] = ["ESSENTIAL", "PLUS", "PREMIUM"];

export default function PackagesPage() {
  return (
    <Suspense fallback={<div className="text-pisome-muted">…</div>}>
      <PackagesInner />
    </Suspense>
  );
}

function PackagesInner() {
  const t = useTranslations("packages");
  const searchParams = useSearchParams();
  const listingId = searchParams.get("listingId");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function select(tier: PackageTier) {
    if (!listingId) {
      setMessage("Open packages from a listing on the agent dashboard.");
      return;
    }
    setLoading(tier);
    setMessage(null);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, tier }),
    });
    const data = await res.json();
    setLoading(null);
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    if (data.demo) {
      setMessage(t("demoCheckout"));
      return;
    }
    setMessage(data.error ?? "Error");
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-pisome-navy">
        {t("title")}
      </h1>
      <p className="mt-2 max-w-xl text-pisome-muted">{t("subtitle")}</p>
      {!listingId && (
        <p className="mt-4 text-sm text-pisome-accent">
          Select a listing from the dashboard to upgrade.
        </p>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {tiers.map((tier) => {
          const plan = PACKAGE_PRICES[tier];
          return (
            <div
              key={tier}
              className={`rounded-2xl border bg-white p-6 ${
                tier === "PREMIUM"
                  ? "border-pisome-navy shadow-lg shadow-pisome-navy/10"
                  : "border-pisome-border"
              }`}
            >
              <h2 className="font-display text-xl font-semibold text-pisome-navy">
                {plan.name}
              </h2>
              <p className="mt-2 font-display text-3xl font-bold text-pisome-navy">
                {(plan.priceCents / 100).toFixed(0)}€
                <span className="text-sm font-normal text-pisome-muted">
                  {t("perMonth")}
                </span>
              </p>
              <ul className="mt-5 space-y-2 text-sm text-pisome-muted">
                {plan.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <Button
                className="mt-6 w-full"
                variant={tier === "PREMIUM" ? "accent" : "primary"}
                disabled={loading === tier}
                onClick={() => select(tier)}
              >
                {t("select")}
              </Button>
            </div>
          );
        })}
      </div>
      {message && <p className="mt-6 text-sm text-pisome-success">{message}</p>}
    </div>
  );
}
