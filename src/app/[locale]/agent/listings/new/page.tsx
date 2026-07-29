"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LAUNCH_CITIES, MIN_PHOTOS } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

const DEFAULT_PHOTOS = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=80",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cd00?w=1200&q=80",
];

export default function NewListingPage() {
  const t = useTranslations();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(publish: boolean) {
    setLoading(true);
    setError(null);
    const form = document.getElementById("listing-form") as HTMLFormElement;
    const data = new FormData(form);

    const mediaRaw = String(data.get("mediaUrls") ?? "");
    const mediaUrls = mediaRaw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    if (publish && mediaUrls.length < MIN_PHOTOS) {
      setError(t("agent.qualityGate"));
      setLoading(false);
      return;
    }

    const city = String(data.get("city"));
    const cityMeta = LAUNCH_CITIES.find(
      (c) => c.name === city || c.nameEn === city,
    );

    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: data.get("title"),
        titleEn: data.get("titleEn") || undefined,
        description: data.get("description"),
        descriptionEn: data.get("descriptionEn") || undefined,
        propertyType: data.get("propertyType"),
        price: Number(data.get("price")),
        rooms: Number(data.get("rooms")),
        bathrooms: Number(data.get("bathrooms")),
        areaM2: Number(data.get("areaM2")),
        floor: data.get("floor") ? Number(data.get("floor")) : undefined,
        yearBuilt: data.get("yearBuilt")
          ? Number(data.get("yearBuilt"))
          : undefined,
        energyCert: data.get("energyCert"),
        hasElevator: data.get("hasElevator") === "on",
        hasParking: data.get("hasParking") === "on",
        hasTerrace: data.get("hasTerrace") === "on",
        hasPool: data.get("hasPool") === "on",
        isNewBuild: data.get("isNewBuild") === "on",
        address: data.get("address"),
        neighborhood: data.get("neighborhood"),
        city,
        province: data.get("province"),
        postalCode: data.get("postalCode") || undefined,
        lat: Number(data.get("lat") || cityMeta?.lat || 40.4),
        lng: Number(data.get("lng") || cityMeta?.lng || -3.7),
        mediaUrls,
        publish,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Error");
      return;
    }
    router.push("/agent");
    router.refresh();
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl font-semibold text-pisome-navy">
        {t("agent.newListing")}
      </h1>
      <p className="mt-2 text-sm text-pisome-muted">{t("agent.mediaHint")}</p>

      <form id="listing-form" className="mt-8 space-y-4">
        <Input name="title" required placeholder="Title (ES)" />
        <Input name="titleEn" placeholder="Title (EN)" />
        <Textarea
          name="description"
          required
          placeholder="Description (ES) — min 20 chars"
        />
        <Textarea name="descriptionEn" placeholder="Description (EN)" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Select name="propertyType" defaultValue="APARTMENT">
            {Object.entries({
              APARTMENT: t("propertyTypes.APARTMENT"),
              HOUSE: t("propertyTypes.HOUSE"),
              VILLA: t("propertyTypes.VILLA"),
              PENTHOUSE: t("propertyTypes.PENTHOUSE"),
              STUDIO: t("propertyTypes.STUDIO"),
              TOWNHOUSE: t("propertyTypes.TOWNHOUSE"),
            }).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
          <Input name="price" type="number" required placeholder="Price €" />
          <Input name="rooms" type="number" required defaultValue={3} />
          <Input name="bathrooms" type="number" required defaultValue={2} />
          <Input name="areaM2" type="number" required placeholder="m²" />
          <Input name="floor" type="number" placeholder="Floor" />
          <Input name="yearBuilt" type="number" placeholder="Year built" />
          <Select name="energyCert" defaultValue="C">
            {["A", "B", "C", "D", "E", "F", "G", "PENDING"].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input name="address" required placeholder="Address" />
          <Input name="neighborhood" required placeholder="Neighborhood" />
          <Select name="city" defaultValue="Madrid">
            {LAUNCH_CITIES.map((c) => (
              <option key={c.slug} value={c.name}>
                {c.name}
              </option>
            ))}
          </Select>
          <Input name="province" required defaultValue="Madrid" />
          <Input name="postalCode" placeholder="Postal code" />
          <Input name="lat" type="number" step="any" placeholder="Lat" />
          <Input name="lng" type="number" step="any" placeholder="Lng" />
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-pisome-muted">
          {["hasElevator", "hasParking", "hasTerrace", "hasPool", "isNewBuild"].map(
            (name) => (
              <label key={name} className="inline-flex items-center gap-2">
                <input type="checkbox" name={name} className="accent-pisome-blue" />
                {name.replace("has", "").replace("is", "")}
              </label>
            ),
          )}
        </div>
        <Textarea
          name="mediaUrls"
          required
          defaultValue={DEFAULT_PHOTOS.join("\n")}
          placeholder="Photo URLs (one per line)"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex flex-wrap gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => submit(false)}
          >
            {t("agent.saveDraft")}
          </Button>
          <Button
            type="button"
            variant="accent"
            disabled={loading}
            onClick={() => submit(true)}
          >
            {t("agent.publish")}
          </Button>
        </div>
      </form>
    </div>
  );
}
