import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isStripeEnabled, PACKAGE_PRICES, stripe } from "@/lib/stripe";
import type { PackageTier } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  listingId: z.string(),
  tier: z.enum(["ESSENTIAL", "PLUS", "PREMIUM"]),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = schema.parse(await req.json());
  const listing = await prisma.listing.findFirst({
    where: { id: body.listingId, agentId: session.user.id },
  });
  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const plan = PACKAGE_PRICES[body.tier as PackageTier];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!isStripeEnabled || !stripe) {
    await prisma.listing.update({
      where: { id: listing.id },
      data: {
        packageTier: body.tier,
        featured: body.tier !== "ESSENTIAL",
      },
    });
    await prisma.order.create({
      data: {
        userId: session.user.id,
        listingId: listing.id,
        tier: body.tier,
        amountCents: plan.priceCents,
        status: "demo_paid",
      },
    });
    return NextResponse.json({ demo: true, ok: true });
  }

  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      listingId: listing.id,
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
            name: `Pisome ${plan.name} — ${listing.title}`,
          },
        },
      },
    ],
    success_url: `${appUrl}/es/agent?upgraded=${listing.id}`,
    cancel_url: `${appUrl}/es/agent/packages?listingId=${listing.id}`,
    metadata: {
      orderId: order.id,
      listingId: listing.id,
      tier: body.tier,
    },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { stripeSessionId: checkout.id },
  });

  return NextResponse.json({ url: checkout.url });
}
