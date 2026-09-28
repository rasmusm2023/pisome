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
    password: z.string().min(6).max(100).optional(),
    passwordConfirm: z.string().min(6).max(100).optional(),
    phone: z.string().trim().min(8).max(30),
    agencyName: z.string().trim().min(2).max(120),
    city: z.string().trim().min(2).max(80),
    licenseNumber: z.string().trim().min(3).max(60),
    confirmAgent: z.literal(true),
  })
  .superRefine((data, ctx) => {
    if (data.email.toLowerCase() !== data.emailConfirm.toLowerCase()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "email_mismatch",
        path: ["emailConfirm"],
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
    agencyName: data.agencyName,
    city: data.city,
    licenseNumber: data.licenseNumber,
    role: "AGENT" as const,
    planStatus: "UNPAID" as const,
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
    const mismatch = parsed.error.issues.some(
      (issue) => issue.message === "email_mismatch",
    );
    if (mismatch) {
      return NextResponse.json({ error: "email_mismatch" }, { status: 400 });
    }
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const data = parsed.data;
  const sessionUser = await getSessionUser();
  const profile = profileData(data);

  if (sessionUser) {
    if (sessionUser.role === "AGENT" || sessionUser.role === "ADMIN") {
      return NextResponse.json({ ok: true, alreadyAgent: true });
    }
    await prisma.user.update({
      where: { id: sessionUser.id },
      data: profile,
    });
    return NextResponse.json({ ok: true, upgraded: true });
  }

  const password = data.password;
  const passwordConfirm = data.passwordConfirm;
  if (!password || !passwordConfirm) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (password !== passwordConfirm) {
    return NextResponse.json({ error: "password_mismatch" }, { status: 400 });
  }

  const email = data.email.toLowerCase();
  const admin = createSupabaseAdminClient();
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name: profile.name,
      firstName: data.firstName,
      lastName: data.lastName,
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
