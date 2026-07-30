"use client";

import { SaveButton } from "@/components/listings/save-button";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { ChevronRight, MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const LAST_SEARCH_KEY = "pisome:lastSearch";

export function rememberSearchPath(pathWithQuery: string) {
  try {
    sessionStorage.setItem(LAST_SEARCH_KEY, pathWithQuery);
  } catch {
    /* ignore */
  }
}

export function ListingToolbar({
  listingId,
  address,
  initialSaved,
  hasThumbs = false,
}: {
  listingId: string;
  address: string;
  initialSaved: boolean;
  hasThumbs?: boolean;
}) {
  const t = useTranslations();
  const [searchHref, setSearchHref] = useState("/search");

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(LAST_SEARCH_KEY);
      if (stored?.startsWith("/")) setSearchHref(stored);
    } catch {
      /* ignore */
    }
  }, []);

  function scrollToContact() {
    const panel = document.getElementById("contact-broker");
    const nameInput = document.getElementById(
      "inquiry-name",
    ) as HTMLInputElement | null;
    if (!panel) return;

    panel.scrollIntoView({ behavior: "smooth", block: "start" });

    window.setTimeout(() => {
      nameInput?.focus({ preventScroll: true });
      panel.classList.remove("pisome-contact-blink");
      // Restart animation if already applied
      void panel.offsetWidth;
      panel.classList.add("pisome-contact-blink");
      window.setTimeout(() => {
        panel.classList.remove("pisome-contact-blink");
      }, 2500);
    }, 450);
  }

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <nav aria-label="Breadcrumb" className="min-w-0">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-pisome-muted">
          <li>
            <Link
              href={searchHref}
              className="font-medium text-pisome-blue transition hover:text-pisome-blue-dark"
            >
              {t("listing.breadcrumbSearch")}
            </Link>
          </li>
          <li aria-hidden className="text-pisome-border">
            <ChevronRight className="h-3.5 w-3.5" />
          </li>
          <li className="truncate font-medium text-pisome-navy" aria-current="page">
            {address}
          </li>
        </ol>
      </nav>

      <div
        className={
          hasThumbs
            ? "flex shrink-0 flex-wrap items-center gap-2 sm:mr-[calc(9rem+0.75rem)]"
            : "flex shrink-0 flex-wrap items-center gap-2"
        }
      >
        <SaveButton listingId={listingId} initialSaved={initialSaved} />
        <Button type="button" variant="primary" onClick={scrollToContact}>
          <MessageSquare className="h-4 w-4" />
          {t("cta.contactBroker")}
        </Button>
      </div>
    </div>
  );
}
