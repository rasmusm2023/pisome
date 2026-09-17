import type { PackageTier, PropertyType } from "../src/lib/types";
import { slugify } from "../src/lib/utils";
import type { SeedListing } from "./seed-types";

type Area = {
  city: string;
  province: string;
  neighborhood: string;
  lat: number;
  lng: number;
  /** Typical €/m² for a mid apartment */
  ppm: number;
  streets: string[];
  count: number;
};

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
    return a / 4294967296;
  };
}

function pick<T>(rand: () => number, items: T[]): T {
  return items[Math.floor(rand() * items.length)]!;
}

function lerp(rand: () => number, min: number, max: number) {
  return min + rand() * (max - min);
}

function roundTo(n: number, step: number) {
  return Math.round(n / step) * step;
}

const TAGS = [
  "private pool",
  "shared pool",
  "garage",
  "sea view",
  "mountain view",
  "city view",
  "balcony",
  "garden",
  "terrace",
  "rooftop terrace",
  "air conditioning",
  "underfloor heating",
  "fireplace",
  "storage room",
  "elevator",
  "pet friendly",
  "south facing",
  "natural light",
  "renovated",
  "open kitchen",
  "walk-in closet",
  "laundry room",
  "gym",
  "security",
  "beach nearby",
  "golf nearby",
  "quiet area",
  "central location",
];

const TYPES: { type: PropertyType; weight: number; rooms: [number, number]; area: [number, number] }[] =
  [
    { type: "APARTMENT", weight: 48, rooms: [1, 4], area: [45, 140] },
    { type: "PENTHOUSE", weight: 10, rooms: [2, 4], area: [80, 180] },
    { type: "STUDIO", weight: 6, rooms: [1, 1], area: [28, 48] },
    { type: "TOWNHOUSE", weight: 10, rooms: [3, 5], area: [110, 220] },
    { type: "HOUSE", weight: 12, rooms: [3, 6], area: [130, 280] },
    { type: "VILLA", weight: 10, rooms: [4, 7], area: [180, 420] },
    { type: "LAND", weight: 4, rooms: [0, 0], area: [400, 1800] },
  ];

const COPY: Record<
  PropertyType,
  { title: [string, string]; titleEn: [string, string]; body: [string, string]; bodyEn: [string, string] }[]
> = {
  APARTMENT: [
    {
      title: ["Piso en", ""],
      titleEn: ["Flat in", ""],
      body: [
        "Vivienda luminosa en {n}, {c}. Distribución práctica, buenos acabados y comunicaciones excelentes.",
        "Piso bien conservado en {n}. Ideal como vivienda habitual o inversión, con servicios a pie de calle.",
      ],
      bodyEn: [
        "Bright home in {n}, {c}. Practical layout, solid finishes and excellent transport links.",
        "Well-kept flat in {n}. Works as a main home or investment, with daily services on the doorstep.",
      ],
    },
  ],
  PENTHOUSE: [
    {
      title: ["Ático en", ""],
      titleEn: ["Penthouse in", ""],
      body: [
        "Ático con terraza en {n}, {c}. Luz, vistas y un ambiente más privado que un piso convencional.",
        "Última planta en {n} con terraza usable todo el año y muy buena orientación.",
      ],
      bodyEn: [
        "Penthouse with terrace in {n}, {c}. Light, views and more privacy than a standard flat.",
        "Top floor in {n} with a terrace you can use year-round and a strong orientation.",
      ],
    },
  ],
  STUDIO: [
    {
      title: ["Estudio en", ""],
      titleEn: ["Studio in", ""],
      body: [
        "Estudio compacto y bien resuelto en {n}, {c}. Perfecto como primera vivienda o piso de alquiler.",
        "Espacio diáfano en {n}, listo para entrar a vivir, cerca de todo.",
      ],
      bodyEn: [
        "Compact, well-resolved studio in {n}, {c}. Ideal as a first home or rental.",
        "Open-plan space in {n}, move-in ready and close to everything.",
      ],
    },
  ],
  TOWNHOUSE: [
    {
      title: ["Adosado en", ""],
      titleEn: ["Townhouse in", ""],
      body: [
        "Casa adosada en {n}, {c}. Más espacio que un piso, con zona exterior y garaje.",
        "Adosado familiar en {n}, con patio y una distribución pensada para el día a día.",
      ],
      bodyEn: [
        "Townhouse in {n}, {c}. More space than a flat, with outdoor area and garage.",
        "Family townhouse in {n}, with a patio and a layout built for everyday life.",
      ],
    },
  ],
  HOUSE: [
    {
      title: ["Casa en", ""],
      titleEn: ["House in", ""],
      body: [
        "Casa independiente en {n}, {c}. Jardín, luz y calma, sin perder acceso a la ciudad.",
        "Vivienda unifamiliar en {n} con espacios exteriores y ambiente residencial.",
      ],
      bodyEn: [
        "Detached house in {n}, {c}. Garden, light and calm, still close to the city.",
        "Single-family home in {n} with outdoor space and a residential feel.",
      ],
    },
  ],
  VILLA: [
    {
      title: ["Villa en", ""],
      titleEn: ["Villa in", ""],
      body: [
        "Villa de diseño en {n}, {c}. Privacidad, piscina y una parcela fácil de mantener.",
        "Villa contemporánea en {n} con zonas de día abiertas y orientación privilegiada.",
      ],
      bodyEn: [
        "Design villa in {n}, {c}. Privacy, a pool and an easy-care plot.",
        "Contemporary villa in {n} with open living spaces and a strong orientation.",
      ],
    },
  ],
  LAND: [
    {
      title: ["Parcela en", ""],
      titleEn: ["Plot in", ""],
      body: [
        "Parcela urbana en {n}, {c}. Orientación abierta y fácil acceso. Ideal para construir a medida.",
        "Suelo residencial en {n}, listo para un proyecto de vivienda unifamiliar.",
      ],
      bodyEn: [
        "Urban plot in {n}, {c}. Open orientation and easy access. Ideal for a custom build.",
        "Residential land in {n}, ready for a single-family project.",
      ],
    },
  ],
  OTHER: [
    {
      title: ["Propiedad en", ""],
      titleEn: ["Property in", ""],
      body: ["Propiedad en {n}, {c}.", "Property in {n}, {c}."],
      bodyEn: ["Property in {n}, {c}.", "Property in {n}, {c}."],
    },
  ],
};

const AREAS: Area[] = [
  { city: "Madrid", province: "Madrid", neighborhood: "Salamanca", lat: 40.4312, lng: -3.6871, ppm: 7200, count: 6, streets: ["Calle de Serrano", "Calle de Velázquez", "Calle de Goya", "Calle de Núñez de Balboa"] },
  { city: "Madrid", province: "Madrid", neighborhood: "Chamberí", lat: 40.4348, lng: -3.7036, ppm: 6500, count: 5, streets: ["Calle de Fuencarral", "Calle de Santa Engracia", "Calle de Ponzano", "Calle de Ríos Rosas"] },
  { city: "Madrid", province: "Madrid", neighborhood: "Retiro", lat: 40.4154, lng: -3.6818, ppm: 6800, count: 5, streets: ["Calle de Menéndez Pelayo", "Calle del Doctor Esquerdo", "Calle de Ibiza", "Calle de Narváez"] },
  { city: "Madrid", province: "Madrid", neighborhood: "Lavapiés", lat: 40.4089, lng: -3.7028, ppm: 5200, count: 4, streets: ["Calle de Embajadores", "Calle del Ave María", "Calle de Argumosa", "Calle de Valencia"] },
  { city: "Madrid", province: "Madrid", neighborhood: "La Latina", lat: 40.4112, lng: -3.7084, ppm: 5600, count: 4, streets: ["Calle de Toledo", "Calle de la Cava Baja", "Carrera de San Francisco", "Plaza de la Paja"] },
  { city: "Madrid", province: "Madrid", neighborhood: "Arganzuela", lat: 40.3984, lng: -3.6948, ppm: 4800, count: 4, streets: ["Paseo de las Delicias", "Calle de Méndez Álvaro", "Paseo de Santa María de la Cabeza"] },
  { city: "Madrid", province: "Madrid", neighborhood: "Chamartín", lat: 40.4589, lng: -3.6762, ppm: 6100, count: 4, streets: ["Calle de Colombia", "Avenida de Alberto Alcocer", "Calle de Mateo Inurria"] },
  { city: "Barcelona", province: "Barcelona", neighborhood: "Eixample", lat: 41.3917, lng: 2.1649, ppm: 6900, count: 6, streets: ["Carrer de Provença", "Carrer de Mallorca", "Carrer de València", "Carrer de Aragó"] },
  { city: "Barcelona", province: "Barcelona", neighborhood: "Gràcia", lat: 41.4036, lng: 2.1571, ppm: 6400, count: 5, streets: ["Carrer de Verdi", "Travessera de Gràcia", "Carrer Gran de Gràcia", "Plaça del Sol"] },
  { city: "Barcelona", province: "Barcelona", neighborhood: "Poblenou", lat: 41.4032, lng: 2.1995, ppm: 5800, count: 5, streets: ["Rambla del Poblenou", "Carrer de Pujades", "Carrer de Llull", "Avinguda Diagonal"] },
  { city: "Barcelona", province: "Barcelona", neighborhood: "Sarrià", lat: 41.3996, lng: 2.1214, ppm: 7500, count: 4, streets: ["Carrer Major de Sarrià", "Via Augusta", "Passeig de la Bonanova"] },
  { city: "Barcelona", province: "Barcelona", neighborhood: "Sants", lat: 41.3754, lng: 2.1358, ppm: 4900, count: 4, streets: ["Carrer de Sants", "Carrer de Galileu", "Plaça de Sants"] },
  { city: "Barcelona", province: "Barcelona", neighborhood: "Barceloneta", lat: 41.3802, lng: 2.1894, ppm: 6200, count: 4, streets: ["Passeig Marítim", "Carrer de Balboa", "Carrer de l'Almirall Aixada"] },
  { city: "Valencia", province: "Valencia", neighborhood: "Ruzafa", lat: 39.4628, lng: -0.3721, ppm: 3200, count: 5, streets: ["Carrer de Cadis", "Carrer de Cuba", "Carrer de Sueca", "Carrer de Cádiz"] },
  { city: "Valencia", province: "Valencia", neighborhood: "El Cabanyal", lat: 39.4665, lng: -0.3289, ppm: 3100, count: 4, streets: ["Carrer de la Reina", "Carrer de Pescadors", "Passeig Marítim"] },
  { city: "Valencia", province: "Valencia", neighborhood: "Ciutat Vella", lat: 39.4752, lng: -0.3758, ppm: 3600, count: 4, streets: ["Carrer de Cavallers", "Plaza de la Reina", "Carrer de la Pau"] },
  { city: "Valencia", province: "Valencia", neighborhood: "Benimaclet", lat: 39.4861, lng: -0.3542, ppm: 2800, count: 3, streets: ["Carrer d'Emilio Baró", "Avinguda de Catalunya", "Carrer de Murta"] },
  { city: "Málaga", province: "Málaga", neighborhood: "Centro", lat: 36.7213, lng: -4.4214, ppm: 3400, count: 5, streets: ["Calle Larios", "Calle Granada", "Calle Strachan", "Calle Molina Lario"] },
  { city: "Málaga", province: "Málaga", neighborhood: "Pedregalejo", lat: 36.7224, lng: -4.3761, ppm: 3800, count: 4, streets: ["Paseo Marítimo de Pedregalejo", "Calle Bolivia", "Calle Salvador Dali"] },
  { city: "Málaga", province: "Málaga", neighborhood: "Teatinos", lat: 36.7171, lng: -4.4672, ppm: 2600, count: 3, streets: ["Boulevard Louis Pasteur", "Calle El Romeral", "Avenida de Louis Pasteur"] },
  { city: "Marbella", province: "Málaga", neighborhood: "Centro", lat: 36.5097, lng: -4.8861, ppm: 5200, count: 4, streets: ["Avenida Ricardo Soriano", "Calle Ancha", "Avenida Ramón y Cajal"] },
  { city: "Marbella", province: "Málaga", neighborhood: "Puerto Banús", lat: 36.4878, lng: -4.9524, ppm: 7800, count: 4, streets: ["Avenida Playas del Duque", "Urbanización La Alcazaba", "Nueva Andalucía"] },
  { city: "Sevilla", province: "Sevilla", neighborhood: "Triana", lat: 37.3834, lng: -6.0028, ppm: 3100, count: 5, streets: ["Calle San Jacinto", "Calle Pureza", "Calle Betis", "Calle Pagés del Corro"] },
  { city: "Sevilla", province: "Sevilla", neighborhood: "Santa Cruz", lat: 37.3851, lng: -5.9904, ppm: 3800, count: 4, streets: ["Calle Mateos Gago", "Calle Santa Teresa", "Plaza de Doña Elvira"] },
  { city: "Sevilla", province: "Sevilla", neighborhood: "Nervión", lat: 37.3829, lng: -5.9741, ppm: 2900, count: 3, streets: ["Avenida de Kansas City", "Calle Luis de Morales", "Avenida de la Buhaira"] },
  { city: "Bilbao", province: "Bizkaia", neighborhood: "Casco Viejo", lat: 43.2569, lng: -2.9234, ppm: 4200, count: 4, streets: ["Calle Somera", "Calle Correo", "Plaza Nueva"] },
  { city: "Bilbao", province: "Bizkaia", neighborhood: "Abando", lat: 43.2628, lng: -2.9351, ppm: 4500, count: 4, streets: ["Gran Vía", "Calle Elcano", "Alameda de Recalde"] },
  { city: "Bilbao", province: "Bizkaia", neighborhood: "Deusto", lat: 43.2714, lng: -2.9468, ppm: 3600, count: 3, streets: ["Avenida de las Universidades", "Calle Iruña", "Calle Ramón y Cajal"] },
  { city: "San Sebastián", province: "Gipuzkoa", neighborhood: "Gros", lat: 43.3221, lng: -1.9734, ppm: 6100, count: 4, streets: ["Calle Zabaleta", "Avenida de Navarra", "Calle Peña y Goñi"] },
  { city: "San Sebastián", province: "Gipuzkoa", neighborhood: "Antiguo", lat: 43.3124, lng: -2.0061, ppm: 5800, count: 3, streets: ["Paseo de Heriz", "Avenida de Satrústegui", "Calle Matia"] },
  { city: "Palma", province: "Illes Balears", neighborhood: "Santa Catalina", lat: 39.5712, lng: 2.6374, ppm: 4800, count: 4, streets: ["Carrer de Sant Magí", "Carrer d'Annibal", "Passeig Marítim"] },
  { city: "Palma", province: "Illes Balears", neighborhood: "El Terreno", lat: 39.5611, lng: 2.6262, ppm: 5100, count: 3, streets: ["Avinguda de Joan Miró", "Carrer de Camilo José Cela"] },
  { city: "Alicante", province: "Alicante", neighborhood: "Centro", lat: 38.3452, lng: -0.481, ppm: 2400, count: 4, streets: ["Explanada de España", "Calle Castaños", "Avenida de Maisonnave"] },
  { city: "Alicante", province: "Alicante", neighborhood: "Playa de San Juan", lat: 38.3724, lng: -0.4182, ppm: 2800, count: 3, streets: ["Avenida de Ansaldo", "Avenida de Condomina", "Calle Oslo"] },
  { city: "Zaragoza", province: "Zaragoza", neighborhood: "Centro", lat: 41.6488, lng: -0.8891, ppm: 2300, count: 4, streets: ["Paseo de la Independencia", "Calle Alfonso I", "Calle Don Jaime I"] },
  { city: "Zaragoza", province: "Zaragoza", neighborhood: "Delicias", lat: 41.6502, lng: -0.9264, ppm: 1800, count: 3, streets: ["Avenida de Navarra", "Calle Rioja", "Calle Santander"] },
  { city: "Granada", province: "Granada", neighborhood: "Albaicín", lat: 37.181, lng: -3.593, ppm: 2700, count: 4, streets: ["Carrera del Darro", "Calle Panaderos", "Calle Pagés"] },
  { city: "Granada", province: "Granada", neighborhood: "Realejo", lat: 37.1734, lng: -3.595, ppm: 2500, count: 3, streets: ["Cuesta del Realejo", "Calle San Cecilio", "Plaza de los Campos"] },
  { city: "Cádiz", province: "Cádiz", neighborhood: "Centro", lat: 36.5297, lng: -6.2926, ppm: 2900, count: 4, streets: ["Calle Ancha", "Plaza de San Juan de Dios", "Paseo Marítimo"] },
  { city: "Córdoba", province: "Córdoba", neighborhood: "Centro", lat: 37.8882, lng: -4.7794, ppm: 2200, count: 4, streets: ["Calle Cruz Conde", "Calle San Fernando", "Plaza de las Tendillas"] },
  { city: "Murcia", province: "Murcia", neighborhood: "Centro", lat: 37.9922, lng: -1.1307, ppm: 1900, count: 3, streets: ["Gran Vía", "Calle Trapería", "Avenida de la Libertad"] },
  { city: "Santander", province: "Cantabria", neighborhood: "El Sardinero", lat: 43.4741, lng: -3.7852, ppm: 3300, count: 3, streets: ["Avenida de la Reina Victoria", "Calle Joaquín Costa", "Paseo de Pérez Galdós"] },
  { city: "A Coruña", province: "A Coruña", neighborhood: "Orzán", lat: 43.3714, lng: -8.4061, ppm: 2600, count: 3, streets: ["Rúa Orillamar", "Rúa San Andrés", "Paseo Marítimo"] },
  { city: "Toledo", province: "Toledo", neighborhood: "Casco histórico", lat: 39.8586, lng: -4.0246, ppm: 2100, count: 3, streets: ["Calle Comercio", "Calle Santo Tomé", "Paseo de Recaredo"] },
  { city: "Girona", province: "Girona", neighborhood: "Barri Vell", lat: 41.9842, lng: 2.8249, ppm: 3100, count: 3, streets: ["Carrer de la Força", "Rambla de la Llibertat", "Plaça del Vi"] },
  { city: "Tarragona", province: "Tarragona", neighborhood: "Part Alta", lat: 41.1187, lng: 1.2584, ppm: 2400, count: 3, streets: ["Carrer Major", "Rambla Nova", "Passeig de Sant Antoni"] },
  { city: "Ibiza", province: "Illes Balears", neighborhood: "Vila", lat: 38.9065, lng: 1.4361, ppm: 7200, count: 3, streets: ["Carrer de sa Carrossa", "Passeig Vara de Rey", "Avinguda d'Espanya"] },
  { city: "Las Palmas", province: "Las Palmas", neighborhood: "Las Canteras", lat: 28.1412, lng: -15.4354, ppm: 3200, count: 3, streets: ["Paseo de Las Canteras", "Calle Secretario Artiles", "Calle Tomás Miller"] },
  { city: "Santa Cruz de Tenerife", province: "Santa Cruz de Tenerife", neighborhood: "Centro", lat: 28.4636, lng: -16.2518, ppm: 2500, count: 3, streets: ["Rambla de Santa Cruz", "Calle Castillo", "Avenida de Anaga"] },
  { city: "Vigo", province: "Pontevedra", neighborhood: "Centro", lat: 42.2314, lng: -8.7124, ppm: 2300, count: 3, streets: ["Rúa do Príncipe", "Rúa Urzáiz", "Praza de Compostela"] },
  { city: "Oviedo", province: "Asturias", neighborhood: "Centro", lat: 43.3619, lng: -5.8494, ppm: 2200, count: 3, streets: ["Calle Uría", "Calle Fruela", "Plaza de la Escandalera"] },
  { city: "Valladolid", province: "Valladolid", neighborhood: "Centro", lat: 41.6523, lng: -4.7245, ppm: 2000, count: 3, streets: ["Calle Santiago", "Calle Teresa Gil", "Plaza Mayor"] },
];

function pickType(rand: () => number, area: Area): PropertyType {
  const coastal =
    /Marbella|Málaga|Palma|Alicante|Cádiz|Santander|Ibiza|Las Palmas|Tenerife|Barceloneta|Cabanyal|Pedregalejo|Banús|Canteras|Sardinero/.test(
      `${area.city} ${area.neighborhood}`,
    );
  const weights = TYPES.map((t) => {
    let w = t.weight;
    if (coastal && (t.type === "VILLA" || t.type === "APARTMENT")) w += 8;
    if (!coastal && t.type === "VILLA") w -= 4;
    if (area.ppm > 6000 && t.type === "STUDIO") w += 3;
    return { type: t.type, weight: Math.max(1, w) };
  });
  const total = weights.reduce((s, w) => s + w.weight, 0);
  let r = rand() * total;
  for (const w of weights) {
    r -= w.weight;
    if (r <= 0) return w.type;
  }
  return "APARTMENT";
}

function statsFor(type: PropertyType, rand: () => number) {
  const def = TYPES.find((t) => t.type === type) ?? TYPES[0]!;
  const rooms =
    type === "LAND" ? 0 : Math.round(lerp(rand, def.rooms[0], def.rooms[1]));
  const areaM2 = roundTo(lerp(rand, def.area[0], def.area[1]), type === "LAND" ? 50 : 1);
  const bathrooms =
    type === "LAND" ? 0 : Math.max(1, Math.min(rooms || 1, Math.round(rooms * 0.6 + rand())));
  return { rooms, bathrooms, areaM2 };
}

export function generateFakeListings(reservedSlugs: Set<string>): SeedListing[] {
  const out: SeedListing[] = [];
  let index = 0;

  for (const area of AREAS) {
    for (let i = 0; i < area.count; i++) {
      const rand = rng(index * 9973 + area.neighborhood.length * 13 + i * 17);
      const propertyType = pickType(rand, area);
      const { rooms, bathrooms, areaM2 } = statsFor(propertyType, rand);
      const street = pick(rand, area.streets);
      const number = 3 + Math.floor(rand() * 160);
      const address =
        propertyType === "VILLA" || propertyType === "LAND"
          ? `Urbanización ${area.neighborhood} ${number}`
          : `${street} ${number}`;

      const typeMult =
        propertyType === "VILLA"
          ? 1.35
          : propertyType === "PENTHOUSE"
            ? 1.18
            : propertyType === "HOUSE"
              ? 1.05
              : propertyType === "LAND"
                ? 0.22
                : propertyType === "STUDIO"
                  ? 1.08
                  : 1;
      const price = roundTo(area.ppm * typeMult * areaM2 * lerp(rand, 0.82, 1.22), 1000);

      const yearBuilt = Math.round(lerp(rand, 1925, 2025));
      const isNewBuild = yearBuilt >= 2023;
      const floor =
        propertyType === "APARTMENT" ||
        propertyType === "PENTHOUSE" ||
        propertyType === "STUDIO"
          ? propertyType === "PENTHOUSE"
            ? 4 + Math.floor(rand() * 5)
            : 1 + Math.floor(rand() * 7)
          : undefined;

      const certs = ["A", "B", "C", "D", "E"] as const;
      const energyCert = isNewBuild ? pick(rand, ["A", "B"] as const) : pick(rand, certs);

      const hasTerrace =
        propertyType === "PENTHOUSE" ||
        propertyType === "VILLA" ||
        rand() > 0.55;
      const hasParking =
        propertyType === "VILLA" ||
        propertyType === "HOUSE" ||
        propertyType === "TOWNHOUSE" ||
        rand() > 0.62;
      const hasPool = propertyType === "VILLA" || (isNewBuild && rand() > 0.7);
      const hasElevator =
        (propertyType === "APARTMENT" || propertyType === "PENTHOUSE") &&
        (floor ?? 0) >= 2 &&
        rand() > 0.25;

      const tagCount = 1 + Math.floor(rand() * 4);
      const tags: string[] = [];
      while (tags.length < tagCount) {
        const tag = pick(rand, TAGS);
        if (!tags.includes(tag)) tags.push(tag);
      }
      if (hasPool && !tags.includes("private pool") && !tags.includes("shared pool")) {
        tags.push(area.ppm > 5000 ? "private pool" : "shared pool");
      }
      if (hasTerrace && !tags.includes("terrace") && !tags.includes("rooftop terrace")) {
        tags.push(propertyType === "PENTHOUSE" ? "rooftop terrace" : "terrace");
      }

      const copy = pick(rand, COPY[propertyType]);
      const title = `${copy.title[0]} ${area.neighborhood}`.trim();
      const titleEn = `${copy.titleEn[0]} ${area.neighborhood}`.trim();
      const description = pick(rand, copy.body)
        .replace("{n}", area.neighborhood)
        .replace("{c}", area.city);
      const descriptionEn = pick(rand, copy.bodyEn)
        .replace("{n}", area.neighborhood)
        .replace("{c}", area.city);

      const packageRoll = rand();
      const packageTier: PackageTier =
        propertyType === "LAND"
          ? "ESSENTIAL"
          : packageRoll > 0.92
            ? "PREMIUM"
            : packageRoll > 0.72
              ? "PLUS"
              : "ESSENTIAL";
      const featured =
        packageTier === "PREMIUM" && propertyType !== "LAND" && rand() > 0.45;

      let slug = slugify(
        `${propertyType}-${area.neighborhood}-${area.city}-${number}-${index}`,
      );
      while (reservedSlugs.has(slug) || out.some((l) => l.slug === slug)) {
        slug = `${slug}-${Math.floor(rand() * 99)}`;
      }

      out.push({
        slug,
        title,
        titleEn,
        description,
        descriptionEn,
        propertyType,
        price: Math.max(65000, price),
        rooms,
        bathrooms,
        areaM2,
        floor,
        yearBuilt,
        energyCert,
        hasElevator,
        hasParking,
        hasTerrace,
        hasPool,
        isNewBuild,
        tags,
        address,
        neighborhood: area.neighborhood,
        city: area.city,
        province: area.province,
        lat: area.lat + lerp(rand, -0.012, 0.012),
        lng: area.lng + lerp(rand, -0.014, 0.014),
        packageTier,
        featured,
        photoOffset: index % 18,
      });
      index += 1;
    }
  }

  return out;
}
