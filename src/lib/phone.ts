import {
  CALLING_COUNTRIES,
  CALLING_COUNTRY_BY_ISO,
  DEFAULT_PHONE_COUNTRY,
  type CallingCountry,
} from "@/lib/calling-codes";

const nameCache = new Map<string, string>();

function displayNames(locale: string) {
  return new Intl.DisplayNames([locale, "en"], { type: "region" });
}

export function countryName(iso2: string, locale: string) {
  const key = `${locale}:${iso2}`;
  const cached = nameCache.get(key);
  if (cached) return cached;
  const name = displayNames(locale).of(iso2) ?? iso2;
  nameCache.set(key, name);
  return name;
}

export function countryFlagSrc(iso2: string) {
  const code = iso2.toLowerCase();
  return {
    src: `https://flagcdn.com/w40/${code}.png`,
    srcSet: `https://flagcdn.com/w40/${code}.png 1x, https://flagcdn.com/w80/${code}.png 2x`,
  };
}

export function formatCountryDial(iso2: string) {
  const country = CALLING_COUNTRY_BY_ISO.get(iso2);
  return country ? `+${country.dial}` : "";
}

function normalizeQuery(query: string) {
  return query
    .trim()
    .toUpperCase()
    .replace(/^\+/, "")
    .replace(/\s+/g, "");
}

const ISO_ALIASES: Record<string, string> = {
  UK: "GB",
  GBR: "GB",
  USA: "US",
  SWE: "SE",
  ESP: "ES",
  DEU: "DE",
  FRA: "FR",
};

function scoreCountry(
  country: CallingCountry,
  query: string,
  locale: string,
): number | null {
  const q = normalizeQuery(query);
  if (!q) return country.iso2 === DEFAULT_PHONE_COUNTRY ? 1 : 0;

  const nameEn = countryName(country.iso2, "en").toUpperCase();
  const nameLoc = countryName(country.iso2, locale).toUpperCase();
  let score = 0;

  if (ISO_ALIASES[q] === country.iso2) score = 195;
  if (country.iso2 === q) score = 200;
  else if (q.length >= 2 && country.iso2.startsWith(q)) score = Math.max(score, 160);

  if (country.dial === q || `+${country.dial}` === query.trim().toUpperCase()) {
    score = Math.max(score, 150);
  } else if (q.length >= 2 && (country.dial.startsWith(q) || q.startsWith(country.dial))) {
    score = Math.max(score, 90);
  }

  if (nameEn === q || nameLoc === q) score = Math.max(score, 180);
  else if (nameEn.startsWith(q) || nameLoc.startsWith(q)) score = Math.max(score, 120);
  else if (q.length >= 3 && (nameEn.includes(q) || nameLoc.includes(q)))
    score = Math.max(score, 70);

  if (score === 0) return null;
  if (country.iso2 === DEFAULT_PHONE_COUNTRY) score += 2;
  return score;
}

export function searchCallingCountries(query: string, locale: string, limit?: number) {
  const ranked = CALLING_COUNTRIES.map((country) => ({
    country,
    score: scoreCountry(country, query, locale),
  }))
    .filter((row): row is { country: CallingCountry; score: number } => row.score !== null)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return countryName(a.country.iso2, locale).localeCompare(
        countryName(b.country.iso2, locale),
        locale,
      );
    });

  const cap = limit ?? (normalizeQuery(query) ? 25 : ranked.length);

  if (!normalizeQuery(query)) {
    const sweden = ranked.find((row) => row.country.iso2 === DEFAULT_PHONE_COUNTRY);
    const rest = ranked.filter((row) => row.country.iso2 !== DEFAULT_PHONE_COUNTRY);
    return (sweden ? [sweden, ...rest] : rest).slice(0, cap).map((row) => row.country);
  }

  return ranked.slice(0, cap).map((row) => row.country);
}

export function bestCallingCountryMatch(query: string, locale: string) {
  return searchCallingCountries(query, locale, 1)[0] ?? CALLING_COUNTRY_BY_ISO.get(DEFAULT_PHONE_COUNTRY)!;
}

export function composeInternationalPhone(iso2: string, national: string) {
  const country = CALLING_COUNTRY_BY_ISO.get(iso2.toUpperCase());
  if (!country) return null;

  let digits = national.replace(/\D/g, "");
  if (!digits) return null;

  if (
    digits.startsWith(country.dial) &&
    digits.length - country.dial.length >= 6
  ) {
    digits = digits.slice(country.dial.length);
  }
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length < 6 || digits.length > 15) return null;

  return `+${country.dial} ${digits}`;
}

export function readSignupPhone(form: FormData) {
  const iso2 = String(form.get("phoneCountry") ?? DEFAULT_PHONE_COUNTRY).toUpperCase();
  const national = String(form.get("phone") ?? "");
  return composeInternationalPhone(iso2, national);
}
