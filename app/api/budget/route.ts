import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");

  const budgets = await db.budget.findMany({
    where: {
      userId: session.user.id,
      ...(year ? { year: parseInt(year) } : {}),
    },
    orderBy: [{ year: "desc" }, { month: "asc" }],
  });

  return NextResponse.json(budgets);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { year, month, category, amount, note, type } = body;

  if (!year || !month || !category || !amount || !type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const budget = await db.budget.create({
    data: {
      userId: session.user.id,
      year: parseInt(year),
      month: parseInt(month),
      category,
      amount: parseFloat(amount),
      note: note || null,
      type,
    },
  });

  return NextResponse.json(budget, { status: 201 });
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

  const budget = await db.budget.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!budget) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.budget.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
