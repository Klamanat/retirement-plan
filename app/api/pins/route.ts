import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pins = await db.mapPin.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(pins);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, lat, lng, note } = await req.json();

  if (!name || lat === undefined || lng === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const pin = await db.mapPin.create({
    data: {
      userId: session.user.id,
      name,
      lat,
      lng,
      note: note || null,
    },
  });

  return NextResponse.json(pin, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  const pin = await db.mapPin.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!pin) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.mapPin.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
