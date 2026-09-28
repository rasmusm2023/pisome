import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({ listingId: z.string().min(1) });

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = schema.parse(await req.json());
  await prisma.savedHome.upsert({
    where: {
      userId_listingId: {
        userId: user.id,
        listingId: body.listingId,
      },
    },
    create: { userId: user.id, listingId: body.listingId },
    update: {},
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = schema.parse(await req.json());
  await prisma.savedHome.deleteMany({
    where: { userId: user.id, listingId: body.listingId },
  });
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const saved = await prisma.savedHome.findMany({
    where: { userId: user.id },
    include: {
      listing: {
        include: { media: { orderBy: { sortOrder: "asc" }, take: 1 } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(saved);
}
