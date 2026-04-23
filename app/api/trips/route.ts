import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const trips = await db.trip.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(trips);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, destination, startDate, endDate, budget, spent, status, note } = body;

  const trip = await db.trip.create({
    data: {
      userId: session.user.id,
      name,
      destination,
      startDate: startDate ? new Date(startDate) : null,
      endDate:   endDate   ? new Date(endDate)   : null,
      budget:    budget    ? parseFloat(budget)   : null,
      spent:     spent     ? parseFloat(spent)    : 0,
      status:    status    ?? "planning",
      note:      note      ?? null,
    },
  });

  return NextResponse.json(trip);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const body = await req.json();
  const { name, destination, startDate, endDate, budget, spent, status, note } = body;

  const trip = await db.trip.update({
    where: { id },
    data: {
      ...(name        !== undefined && { name }),
      ...(destination !== undefined && { destination }),
      ...(startDate   !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(endDate     !== undefined && { endDate:   endDate   ? new Date(endDate)   : null }),
      ...(budget      !== undefined && { budget:    budget    ? parseFloat(budget)  : null }),
      ...(spent       !== undefined && { spent:     parseFloat(spent) }),
      ...(status      !== undefined && { status }),
      ...(note        !== undefined && { note }),
    },
  });

  return NextResponse.json(trip);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await db.trip.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
