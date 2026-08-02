import { PrismaClient } from "@prisma/client";
import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function isServerlessRuntime() {
  return Boolean(
    process.env.NETLIFY ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.LAMBDA_TASK_ROOT,
  );
}

function fileUrlToPath(url: string) {
  const raw = url.replace(/^file:/, "");
  return path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
}

/**
 * Netlify/Lambda filesystems are read-only except /tmp.
 * Copy the seeded SQLite file there so Prisma can open it.
 */
function resolveDatabaseUrl(): string {
  const fromEnv = process.env.DATABASE_URL ?? "file:./dev.db";

  if (!isServerlessRuntime()) {
    return fromEnv;
  }

  const candidates: string[] = [];
  if (fromEnv.startsWith("file:")) {
    candidates.push(fileUrlToPath(fromEnv));
  }
  candidates.push(
    path.join(process.cwd(), "prisma", "deploy.db"),
    path.join(process.cwd(), "prisma", "dev.db"),
  );

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
