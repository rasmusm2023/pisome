export type KeywordDef = {
  /** Canonical stored value (English). */
  value: string;
  en: string;
  es: string;
  /** Extra match terms (any language). */
  aliases?: string[];
};

/** Curated keyword vocabulary — mirrors AI-extracted listing tags. */
export const KEYWORD_CATALOG: KeywordDef[] = [
  { value: "private pool", en: "Private pool", es: "Piscina privada", aliases: ["pool", "piscina"] },
  { value: "shared pool", en: "Shared pool", es: "Piscina comunitaria" },
  { value: "garage", en: "Garage", es: "Garaje", aliases: ["garage spot", "parking space", "plaza de garaje"] },
  { value: "sea view", en: "Sea view", es: "Vistas al mar", aliases: ["havsutsikt", "ocean view", "vistas mar"] },
  { value: "mountain view", en: "Mountain view", es: "Vistas a la montaña" },
  { value: "city view", en: "City view", es: "Vistas a la ciudad" },
  { value: "balcony", en: "Balcony", es: "Balcón" },
  { value: "garden", en: "Garden", es: "Jardín" },
  { value: "terrace", en: "Terrace", es: "Terraza" },
  { value: "rooftop terrace", en: "Rooftop terrace", es: "Terraza en azotea" },
  { value: "air conditioning", en: "Air conditioning", es: "Aire acondicionado", aliases: ["a/c", "ac", "aire"] },
  { value: "underfloor heating", en: "Underfloor heating", es: "Suelo radiante" },
  { value: "fireplace", en: "Fireplace", es: "Chimenea" },
  { value: "storage room", en: "Storage room", es: "Trastero" },
  { value: "elevator", en: "Elevator", es: "Ascensor" },
  { value: "wheelchair accessible", en: "Wheelchair accessible", es: "Accesible" },
  { value: "furnished", en: "Furnished", es: "Amueblado" },
  { value: "unfurnished", en: "Unfurnished", es: "Sin amueblar" },
  { value: "pet friendly", en: "Pet friendly", es: "Admite mascotas" },
  { value: "south facing", en: "South facing", es: "Orientación sur" },
  { value: "natural light", en: "Natural light", es: "Mucha luz natural", aliases: ["luminoso", "bright"] },
  { value: "renovated", en: "Renovated", es: "Reformado" },
  { value: "open kitchen", en: "Open kitchen", es: "Cocina abierta" },
  { value: "walk-in closet", en: "Walk-in closet", es: "Vestidor" },
  { value: "laundry room", en: "Laundry room", es: "Lavadero" },
  { value: "gym", en: "Gym", es: "Gimnasio" },
  { value: "security", en: "Security", es: "Seguridad", aliases: ["portero", "concierge", "doorman"] },
  { value: "beach nearby", en: "Beach nearby", es: "Cerca de la playa", aliases: ["primera línea", "beachfront"] },
  { value: "golf nearby", en: "Golf nearby", es: "Cerca de golf" },
  { value: "quiet area", en: "Quiet area", es: "Zona tranquila" },
  { value: "central location", en: "Central location", es: "Ubicación céntrica" },
];

function labelFor(def: KeywordDef, lang: string) {
  return lang.startsWith("es") ? def.es : def.en;
}

function matchScore(def: KeywordDef, q: string, lang: string) {
  const label = labelFor(def, lang).toLowerCase();
  const value = def.value.toLowerCase();
  const aliases = (def.aliases ?? []).map((a) => a.toLowerCase());
  const hay = [label, value, ...aliases];

  if (hay.some((h) => h === q)) return 0;
  if (hay.some((h) => h.startsWith(q))) return 1;
  if (hay.some((h) => h.split(/[\s/-]+/).some((p) => p.startsWith(q)))) return 2;
  if (hay.some((h) => h.includes(q))) return 3;
  return -1;
}

export function suggestKeywords(
  query: string,
  lang: string,
  exclude: string[] = [],
  limit = 8,
): { value: string; label: string }[] {
  const q = query.trim().toLowerCase();
  if (q.length < 1) return [];

  const excluded = new Set(exclude.map((e) => e.trim().toLowerCase()));

  return KEYWORD_CATALOG.map((def) => {
    const score = matchScore(def, q, lang);
    if (score < 0) return null;
    const label = labelFor(def, lang);
    if (excluded.has(label.toLowerCase()) || excluded.has(def.value.toLowerCase())) {
      return null;
    }
    return { value: def.value, label, score };
  })
    .filter((x): x is { value: string; label: string; score: number } => x != null)
    .sort((a, b) => a.score - b.score || a.label.localeCompare(b.label))
    .slice(0, limit)
    .map(({ value, label }) => ({ value, label }));
}
