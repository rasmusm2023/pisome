import { planExpiryDate } from "@/lib/agent-access";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { isStripeEnabled, PACKAGE_PRICES, stripe } from "@/lib/stripe";
import type { PackageTier } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  listingId: z.string().min(1).optional(),
  tier: z.enum(["ESSENTIAL", "PLUS", "PREMIUM"]),
});

async function activateWorkspacePlan(userId: string, tier: PackageTier) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      planStatus: "ACTIVE",
      planTier: tier,
      planExpiresAt: planExpiryDate(),
    },
  });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "AGENT" && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = schema.parse(await req.json());
  const listing = body.listingId
    ? await prisma.listing.findFirst({
        where: { id: body.listingId, agentId: user.id },
      })
    : null;
  if (body.listingId && !listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const plan = PACKAGE_PRICES[body.tier as PackageTier];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!isStripeEnabled || !stripe) {
    if (listing) {
      await prisma.listing.update({
        where: { id: listing.id },
        data: {
          packageTier: body.tier,
          featured: body.tier !== "ESSENTIAL",
        },
      });
    }
    await activateWorkspacePlan(user.id, body.tier);
    await prisma.order.create({
      data: {
        userId: user.id,
        listingId: listing?.id,
        tier: body.tier,
        amountCents: plan.priceCents,
        status: "demo_paid",
      },
    });
    return NextResponse.json({ demo: true, ok: true });
  }

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      listingId: listing?.id,
      tier: body.tier,
      amountCents: plan.priceCents,
      status: "pending",
    },
  });

  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: plan.priceCents,
          product_data: {
            name: listing
              ? `Pisome ${plan.name} — ${listing.title}`
              : `Pisome ${plan.name} workspace`,
          },
        },
      },
    ],
    success_url: listing
      ? `${appUrl}/es/agent?upgraded=${listing.id}`
      : `${appUrl}/es/agent?subscribed=1`,
    cancel_url: listing
      ? `${appUrl}/es/agent/packages?listingId=${listing.id}`
      : `${appUrl}/es/agent/packages`,
    metadata: {
      orderId: order.id,
      listingId: listing?.id ?? "",
      userId: user.id,
      tier: body.tier,
    },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { stripeSessionId: checkout.id },
  });

  return NextResponse.json({ url: checkout.url });
}
