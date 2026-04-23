import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Run setting lookup + two groupBy aggregations in parallel — avoids full table scan
  const [setting, incomeByMonth, expenseByMonth] = await Promise.all([
    db.retirementSetting.findUnique({ where: { userId: session.user.id } }),
    db.budget.groupBy({
      by: ["year", "month"],
      where: { userId: session.user.id, type: "income" },
      _sum: { amount: true },
    }),
    db.budget.groupBy({
      by: ["year", "month"],
      where: { userId: session.user.id, type: "expense" },
      _sum: { amount: true },
    }),
  ]);

  const avgMonthlyIncome =
    incomeByMonth.length > 0
      ? incomeByMonth.reduce((s, b) => s + (b._sum.amount ?? 0), 0) / incomeByMonth.length
      : 0;

  const avgMonthlyExpense =
    expenseByMonth.length > 0
      ? expenseByMonth.reduce((s, b) => s + (b._sum.amount ?? 0), 0) / expenseByMonth.length
      : 0;

  return NextResponse.json({
    setting,
    avgMonthlyIncome:  Math.round(avgMonthlyIncome),
    avgMonthlyExpense: Math.round(avgMonthlyExpense),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { currentAge, retirementAge, lifeExpectancy, currentSavings,
          expectedReturn, inflationRate, monthlyExpense } = body;

  const data = {
    currentAge:     parseInt(currentAge),
    retirementAge:  parseInt(retirementAge),
    lifeExpectancy: parseInt(lifeExpectancy),
    currentSavings: parseFloat(currentSavings),
    expectedReturn: parseFloat(expectedReturn),
    inflationRate:  parseFloat(inflationRate),
    monthlyExpense: monthlyExpense ? parseFloat(monthlyExpense) : null,
  };

  const setting = await db.retirementSetting.upsert({
    where:  { userId: session.user.id },
    create: { userId: session.user.id, ...data },
    update: data,
  });

  return NextResponse.json(setting);
}
