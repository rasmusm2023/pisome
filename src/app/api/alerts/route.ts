import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { serializeDrawnArea } from "@/lib/geo";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1),
  city: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  minRooms: z.number().optional(),
  propertyType: z.string().optional(),
  drawnArea: z
    .array(z.tuple([z.number(), z.number()]))
    .min(3)
    .max(64)
    .optional(),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = schema.parse(await req.json());
  const alert = await prisma.savedSearch.create({
    data: {
      userId: user.id,
      name: body.name,
      city: body.city,
      minPrice: body.minPrice,
      maxPrice: body.maxPrice,
      minRooms: body.minRooms,
      propertyType: body.propertyType,
      drawnArea: body.drawnArea
        ? serializeDrawnArea(body.drawnArea)
        : null,
      alertsOn: true,
      lastAlertAt: new Date(),
    },
  });

  return NextResponse.json(alert, { status: 201 });
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const alerts = await prisma.savedSearch.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(alerts);
}
