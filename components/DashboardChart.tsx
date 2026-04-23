"use client";

import dynamic from "next/dynamic";

const YearlyChart = dynamic(() => import("@/components/YearlyChart"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] flex items-center justify-center text-gray-400">
      กำลังโหลดกราฟ...
    </div>
  ),
});

interface Budget {
  month: number;
  amount: number;
  type: string;
}

export default function DashboardChart({ budgets }: { budgets: Budget[] }) {
  return <YearlyChart budgets={budgets} />;
}
