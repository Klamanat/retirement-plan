import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const setting = await db.retirementSetting.findUnique({
    where: { userId: session.user.id },
  });

  // Also return budget averages for auto-fill
  const budgets = await db.budget.findMany({
    where: { userId: session.user.id },
  });

  const incomeMonths  = new Set(budgets.filter(b => b.type === "income").map(b => `${b.year}-${b.month}`));
  const expenseMonths = new Set(budgets.filter(b => b.type === "expense").map(b => `${b.year}-${b.month}`));
  const totalIncome   = budgets.filter(b => b.type === "income").reduce((s, b) => s + b.amount, 0);
  const totalExpense  = budgets.filter(b => b.type === "expense").reduce((s, b) => s + b.amount, 0);

  const avgMonthlyIncome  = incomeMonths.size  > 0 ? totalIncome  / incomeMonths.size  : 0;
  const avgMonthlyExpense = expenseMonths.size > 0 ? totalExpense / expenseMonths.size : 0;

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
