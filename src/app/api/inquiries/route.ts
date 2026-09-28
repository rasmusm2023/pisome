import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  listingId: z.string(),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().min(1),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  const body = schema.parse(await req.json());

  const listing = await prisma.listing.findUnique({
    where: { id: body.listingId },
  });
  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const inquiry = await prisma.inquiry.create({
    data: {
      listingId: listing.id,
      agentId: listing.agentId,
      senderId: user?.id,
      name: body.name,
      email: body.email,
      phone: body.phone,
      message: body.message,
    },
  });

  return NextResponse.json(inquiry, { status: 201 });
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((user.role === "AGENT" || user.role === "ADMIN") && !user.subscribed) {
    return NextResponse.json([]);
  }

  const inquiries = await prisma.inquiry.findMany({
    where: {
      OR: [{ agentId: user.id }, { listing: { agentId: user.id } }],
    },
    include: {
      listing: { select: { id: true, title: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(inquiries);
}

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.subscribed) {
    return NextResponse.json({ error: "subscription_required" }, { status: 402 });
  }
  const body = z
    .object({
      id: z.string(),
      status: z.enum(["NEW", "READ", "REPLIED", "CLOSED"]),
    })
    .parse(await req.json());

  const inquiry = await prisma.inquiry.findFirst({
    where: { id: body.id, OR: [{ agentId: user.id }, { listing: { agentId: user.id } }] },
  });
  if (!inquiry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.inquiry.update({
    where: { id: body.id },
    data: { status: body.status },
  });
  return NextResponse.json(updated);
}
