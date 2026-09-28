import "server-only";

import { isWorkspaceUnlocked } from "@/lib/agent-access";
import { prisma } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Role, SessionUser } from "@/lib/types";

export type { SessionUser };

function displayNameFromAuth(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}) {
  const metaName = user.user_metadata?.name;
  if (typeof metaName === "string" && metaName.trim()) return metaName.trim();
  const first = user.user_metadata?.firstName;
  const last = user.user_metadata?.lastName;
  if (typeof first === "string" && typeof last === "string") {
    const combined = `${first} ${last}`.trim();
    if (combined) return combined;
  }
  return user.email?.split("@")[0] ?? "Pisome";
}

export async function getSessionUser(): Promise<SessionUser | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id || !user.email) return null;

  const select = {
    id: true,
    email: true,
    name: true,
    role: true,
    phone: true,
    organizationId: true,
    planStatus: true,
    planTier: true,
    planExpiresAt: true,
  } as const;

  let profile = await prisma.user.findUnique({
    where: { id: user.id },
    select,
  });

  if (!profile) {
    try {
      profile = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email.toLowerCase(),
          name: displayNameFromAuth(user),
          role: "SEEKER",
        },
        select,
      });
    } catch {
      profile = await prisma.user.findUnique({
        where: { id: user.id },
        select,
      });
    }
  }

  if (!profile) return null;

  const role = profile.role as Role;
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    phone: profile.phone,
    role,
    organizationId: profile.organizationId,
    planStatus: profile.planStatus,
    planTier: profile.planTier,
    planExpiresAt: profile.planExpiresAt?.toISOString() ?? null,
    subscribed: isWorkspaceUnlocked({
      role,
      planStatus: profile.planStatus,
      planExpiresAt: profile.planExpiresAt,
    }),
  };
}
