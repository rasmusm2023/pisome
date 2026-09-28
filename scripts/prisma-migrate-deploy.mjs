import { spawnSync } from "node:child_process";

function deriveDirectUrl(databaseUrl) {
  try {
    const url = new URL(databaseUrl);
    if (url.port === "6543") url.port = "5432";
    url.searchParams.delete("pgbouncer");
    return url.toString();
  } catch {
    return databaseUrl;
  }
}

if (!process.env.DIRECT_URL?.trim()) {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required for prisma migrate deploy.");
    process.exit(1);
  }
  process.env.DIRECT_URL = deriveDirectUrl(process.env.DATABASE_URL);
  console.log(
    "DIRECT_URL was unset; using a session-pooler URL derived from DATABASE_URL for migrations.",
  );
}

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: process.env,
  shell: true,
});

process.exit(result.status ?? 1);
