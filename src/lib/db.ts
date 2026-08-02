import "server-only";

import { PrismaClient } from "@prisma/client";
import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Only real Lambda invocations need the /tmp copy.
 * Do NOT treat `NETLIFY=true` as serverless — that env is also set during
 * `next build` on Netlify CI, where the DB lives at prisma/deploy.db.
 */
function isLambdaRuntime() {
  return Boolean(
    process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT,
  );
}

function resolveSqlitePath(fileUrl: string) {
  const raw = fileUrl.replace(/^file:/, "");
  if (path.isAbsolute(raw)) return raw;

  const cwd = /*turbopackIgnore: true*/ process.cwd();
  // Prisma resolves SQLite relative paths against the schema directory.
  return path.join(cwd, "prisma", raw.replace(/^\.\//, ""));
}

/**
 * Netlify/Lambda filesystems are read-only except /tmp.
 * Copy the seeded SQLite file there so Prisma can open it.
 */
function resolveDatabaseUrl(): string {
  const fromEnv = process.env.DATABASE_URL ?? "file:./dev.db";

  if (!isLambdaRuntime()) {
    return fromEnv;
  }

  const cwd = /*turbopackIgnore: true*/ process.cwd();
  const candidates = [
    fromEnv.startsWith("file:") ? resolveSqlitePath(fromEnv) : null,
    path.join(cwd, "prisma", "deploy.db"),
    path.join(cwd, "prisma", "dev.db"),
  ].filter((p): p is string => Boolean(p));

  const source = candidates.find((candidate) => existsSync(candidate));
  if (!source) {
    throw new Error(
      `SQLite database missing in serverless runtime. Checked: ${candidates.join(", ")}`,
    );
  }

  const dest = "/tmp/pisome.db";
  copyFileSync(source, dest);
  return `file:${dest}`;
}

function createPrismaClient() {
  return new PrismaClient({
    datasources: {
      db: {
        url: resolveDatabaseUrl(),
      },
    },
    log:
      process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Reuse the client across warm serverless invocations.
globalForPrisma.prisma = prisma;
