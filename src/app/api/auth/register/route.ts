import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z
  .object({
    firstName: z.string().trim().min(1).max(60),
    lastName: z.string().trim().min(1).max(60),
    email: z.string().trim().email().max(120),
    emailConfirm: z.string().trim().email().max(120),
    password: z.string().min(6).max(100),
    passwordConfirm: z.string().min(6).max(100),
    phone: z.string().trim().min(8).max(30),
    city: z.string().trim().min(2).max(80),
    intent: z.enum(["BUY", "SELL", "BOTH"]),
    locale: z.enum(["es", "en"]).optional(),
    confirmPrivate: z.literal(true),
  })
  .superRefine((data, ctx) => {
    if (data.email.toLowerCase() !== data.emailConfirm.toLowerCase()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "email_mismatch",
        path: ["emailConfirm"],
      });
    }
    if (data.password !== data.passwordConfirm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "password_mismatch",
        path: ["passwordConfirm"],
      });
    }
  });

function profileData(data: z.infer<typeof schema>) {
  const name = `${data.firstName} ${data.lastName}`.trim();
  return {
    name,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    city: data.city,
    intent: data.intent,
    locale: data.locale ?? "es",
    role: "SEEKER" as const,
  };
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    const mismatch = parsed.error.issues.find(
      (issue) =>
        issue.message === "email_mismatch" || issue.message === "password_mismatch",
    );
    if (mismatch) {
      return NextResponse.json({ error: mismatch.message }, { status: 400 });
    }
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const data = parsed.data;
  const sessionUser = await getSessionUser();
  if (sessionUser) {
    if (sessionUser.role === "AGENT" || sessionUser.role === "ADMIN") {
      return NextResponse.json({ ok: true, alreadyAgent: true });
    }
    return NextResponse.json({ ok: true, alreadySignedIn: true });
  }

  const email = data.email.toLowerCase();
  const profile = profileData(data);
  const admin = createSupabaseAdminClient();
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      name: profile.name,
      firstName: data.firstName,
      lastName: data.lastName,
      locale: profile.locale,
    },
  });

  if (error || !created.user) {
    const taken =
      error?.message?.toLowerCase().includes("already") ||
      error?.status === 422;
    return NextResponse.json(
      { error: taken ? "email_taken" : "sign_up_failed" },
      { status: taken ? 409 : 400 },
    );
  }

  await prisma.user.upsert({
    where: { id: created.user.id },
    create: {
      id: created.user.id,
      email,
      ...profile,
    },
    update: {
      email,
      ...profile,
    },
  });

  return NextResponse.json({ ok: true, created: true }, { status: 201 });
}
