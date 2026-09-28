"use client";

import { Input } from "@/components/ui/input";
import { DEFAULT_PHONE_COUNTRY } from "@/lib/calling-codes";
import {
  bestCallingCountryMatch,
  countryFlagSrc,
  countryName,
  formatCountryDial,
  searchCallingCountries,
} from "@/lib/phone";
import { cn } from "@/lib/utils";
import { ChevronsUpDown } from "lucide-react";
import { useLocale } from "next-intl";
import { useEffect, useId, useMemo, useRef, useState } from "react";

function CountryFlag({ iso2, className }: { iso2: string; className?: string }) {
  const flag = countryFlagSrc(iso2);
  return (
    <img
      src={flag.src}
      srcSet={flag.srcSet}
      alt=""
      width={20}
      height={15}
      className={cn("h-3.5 w-5 shrink-0 rounded-sm object-cover", className)}
    />
  );
}

type PhoneCountryFieldProps = {
  name?: string;
  label: string;
  required?: boolean;
  defaultIso2?: string;
};

function PhoneCountryField({
  name = "phoneCountry",
  label,
  required = true,
  defaultIso2 = DEFAULT_PHONE_COUNTRY,
}: PhoneCountryFieldProps) {
  const locale = useLocale();
  const inputId = useId();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const queryRef = useRef("");
  const [iso2, setIso2] = useState(defaultIso2);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);

  queryRef.current = query;

  const matches = useMemo(
    () => (open ? searchCallingCountries(query, locale) : []),
    [open, query, locale],
  );
  const dial = formatCountryDial(iso2);

  useEffect(() => {
    setHighlight(0);
  }, [query, open]);

  useEffect(() => {
    if (!open || !query.trim()) return;
    setIso2(bestCallingCountryMatch(query, locale).iso2);
  }, [open, query, locale]);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();

    function onPointerDown(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      const typed = queryRef.current.trim();
      if (typed) {
        setIso2(bestCallingCountryMatch(typed, locale).iso2);
      }
      setQuery("");
      setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, locale]);

  function selectCountry(next: string) {
    setIso2(next);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative w-[7.25rem] shrink-0">
      <input type="hidden" name={name} value={iso2} />
      <button
        type="button"
        id={inputId}
        aria-label={`${label}: ${countryName(iso2, locale)} ${dial}`}
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex h-16 w-full cursor-pointer items-center gap-1.5 rounded-xl border bg-white px-2.5 text-sm font-medium text-pisome-navy outline-none transition",
          open
            ? "border-pisome-blue ring-2 ring-pisome-blue/15"
            : "border-pisome-border hover:border-pisome-blue/60",
        )}
      >
        <CountryFlag iso2={iso2} />
        <span className="min-w-0 truncate">{dial}</span>
        <ChevronsUpDown className="ml-auto h-3.5 w-3.5 shrink-0 text-pisome-muted" aria-hidden />
      </button>
      {open ? (
        <div className="absolute left-0 z-30 mt-1 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-pisome-border bg-white shadow-lg">
          <div className="border-b border-pisome-border p-2">
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setHighlight((index) =>
                    Math.min(index + 1, Math.max(matches.length - 1, 0)),
                  );
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setHighlight((index) => Math.max(index - 1, 0));
                } else if (event.key === "Enter") {
                  event.preventDefault();
                  if (matches[highlight]) selectCountry(matches[highlight]!.iso2);
                } else if (event.key === "Escape") {
                  setQuery("");
                  setOpen(false);
                }
              }}
              placeholder={label}
              autoComplete="off"
              spellCheck={false}
              className="h-9 w-full rounded-lg border border-pisome-border bg-white px-2.5 text-sm text-pisome-navy outline-none placeholder:text-pisome-muted focus:border-pisome-blue"
            />
          </div>
          <ul id={listId} role="listbox" className="max-h-64 overflow-auto py-1">
            {matches.length === 0 ? (
              <li className="px-3 py-2 text-sm text-pisome-muted">—</li>
            ) : (
              matches.map((country, index) => (
                <li
                  key={country.iso2}
                  role="option"
                  aria-selected={index === highlight}
                >
                  <button
                    type="button"
                    onMouseEnter={() => setHighlight(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectCountry(country.iso2)}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-sm text-pisome-navy",
                      index === highlight && "bg-pisome-alice",
                    )}
                  >
                    <CountryFlag iso2={country.iso2} />
                    <span className="w-12 shrink-0 font-medium">+{country.dial}</span>
                    <span className="truncate">{countryName(country.iso2, locale)}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function PhoneInputRow({
  phoneLabel,
  countryLabel,
}: {
  phoneLabel: string;
  countryLabel: string;
}) {
  return (
    <div className="flex items-stretch gap-2">
      <PhoneCountryField label={countryLabel} />
      <div className="min-w-0 flex-1">
        <Input
          name="phone"
          type="tel"
          required
          minLength={6}
          autoComplete="tel-national"
          inputMode="tel"
          label={phoneLabel}
        />
      </div>
    </div>
  );
}
