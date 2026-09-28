import type { Role } from "@/lib/types";

export function defaultPathForRole(role: Role): string {
  if (role === "AGENT" || role === "ADMIN") return "/agent";
  return "/account";
}

export function safeCallbackUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  if (raw.includes("://")) return null;
  return raw;
}

export function signInHref(callbackUrl?: string | null): string {
  const next = safeCallbackUrl(callbackUrl);
  if (!next) return "/auth/signin";
  return `/auth/signin?callbackUrl=${encodeURIComponent(next)}`;
}

export function pathAfterLogin(role: Role, callbackUrl?: string | null): string {
  const next = safeCallbackUrl(callbackUrl);
  const agentWorkspace =
    Boolean(next) &&
    next!.startsWith("/agent") &&
    !next!.startsWith("/agent/join");
  if (agentWorkspace && role !== "AGENT" && role !== "ADMIN") {
    return defaultPathForRole(role);
  }
  return next ?? defaultPathForRole(role);
}
