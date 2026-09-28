import type { Role } from "@/lib/types";

export function planExpiryDate(from = new Date()) {
  const expires = new Date(from);
  expires.setDate(expires.getDate() + 30);
  return expires;
}

export function isWorkspaceUnlocked(user: {
  role: Role;
  planStatus?: string | null;
  planExpiresAt?: Date | string | null;
}): boolean {
  if (user.role === "ADMIN") return true;
  if (user.role !== "AGENT") return false;
  if (user.planStatus !== "ACTIVE") return false;
  if (!user.planExpiresAt) return true;
  const expiresAt =
    user.planExpiresAt instanceof Date
      ? user.planExpiresAt
      : new Date(user.planExpiresAt);
  return expiresAt.getTime() > Date.now();
}
