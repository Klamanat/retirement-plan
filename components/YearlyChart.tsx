"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { MONTHS } from "@/lib/utils";

interface Budget {
  month: number;
  amount: number;
  type: string;
}

interface Props {
  budgets: Budget[];
}

export default function YearlyChart({ budgets }: Props) {
  // Single-pass O(n) accumulator — avoids 24 filter+reduce iterations
  const monthlyMap = budgets.reduce<Record<number, { income: number; expense: number }>>(
    (acc, b) => {
      if (!acc[b.month]) acc[b.month] = { income: 0, expense: 0 };
      if (b.type === "income") acc[b.month].income += b.amount;
      else acc[b.month].expense += b.amount;
      return acc;
    },
    {}
  );

  const data = Array.from({ length: 12 }, (_, i) => {
    const m = monthlyMap[i + 1] ?? { income: 0, expense: 0 };
    return { name: MONTHS[i], income: m.income, expense: m.expense };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value) =>
            typeof value === "number"
              ? new Intl.NumberFormat("th-TH").format(value) + " บาท"
              : value
          }
        />
        <Legend />
        <Bar dataKey="income" name="รายรับ" fill="#10b981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" name="รายจ่าย" fill="#f43f5e" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
