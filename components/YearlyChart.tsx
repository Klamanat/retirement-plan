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
  const data = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const income = budgets
      .filter((b) => b.month === month && b.type === "income")
      .reduce((sum, b) => sum + b.amount, 0);
    const expense = budgets
      .filter((b) => b.month === month && b.type === "expense")
      .reduce((sum, b) => sum + b.amount, 0);
    return { name: MONTHS[i], income, expense };
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
