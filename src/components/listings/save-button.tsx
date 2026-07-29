"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function SaveButton({
  listingId,
  initialSaved = false,
}: {
  listingId: string;
  initialSaved?: boolean;
}) {
  const t = useTranslations("cta");
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const res = await fetch("/api/saved", {
      method: saved ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
    setLoading(false);
    if (res.status === 401) {
      router.push("/auth/signin");
      return;
    }
    if (res.ok) setSaved(!saved);
  }

  return (
    <Button
      variant={saved ? "secondary" : "outline"}
      onClick={toggle}
      disabled={loading}
    >
      <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
      {saved ? t("saved") : t("save")}
    </Button>
  );
}
