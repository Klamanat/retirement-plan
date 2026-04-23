import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { calculateRetirement } from "@/lib/retirementCalc";
import Link from "next/link";

const MONTH_NAMES = [
  "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน",
  "พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม",
  "กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม",
];

const STATUS_LABEL: Record<string, string> = {
  planning: "วางแผน", booked: "จองแล้ว", completed: "เสร็จแล้ว", cancelled: "ยกเลิก",
};
const STATUS_DOT: Record<string, string> = {
  planning: "bg-indigo-400", booked: "bg-amber-400", completed: "bg-emerald-400", cancelled: "bg-slate-400",
};
const STATUS_BADGE: Record<string, string> = {
  planning: "bg-indigo-50 text-indigo-700 border-indigo-100",
  booked:   "bg-amber-50 text-amber-700 border-amber-100",
  completed:"bg-emerald-50 text-emerald-700 border-emerald-100",
  cancelled:"bg-slate-50 text-slate-500 border-slate-200",
};

const fmt  = (n: number) => new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(n);
const fmtM = (n: number) => (n / 1_000_000).toFixed(1);
const fmtDate = (d: Date | null) => d
  ? new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })
  : null;

function CircleProgress({ pct }: { pct: number }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const offset = circ - Math.min(1, pct / 100) * circ;
  const color = pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#f43f5e";
  return (
    <svg width="76" height="76" className="-rotate-90">
      <circle cx="38" cy="38" r={r} fill="none" stroke="#f1f5f9" strokeWidth="5" />
      <circle cx="38" cy="38" r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
    </svg>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const now = new Date();
  const greeting = now.getHours() < 12 ? "อรุณสวัสดิ์" : now.getHours() < 17 ? "สวัสดีตอนบ่าย" : "สวัสดีตอนเย็น";

  const [retirementSetting, trips, pinCount, budgets] = await Promise.all([
    db.retirementSetting.findUnique({ where: { userId: session.user.id } }),
    db.trip.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } }),
    db.mapPin.count({ where: { userId: session.user.id } }),
    db.budget.findMany({
      where: { userId: session.user.id },
      select: { type: true, amount: true, year: true, month: true },
    }),
  ]);

  let retirementProgress = 0, yearsToRetirement = 0, requiredFund = 0, projectedFund = 0, shortfall = 0;

  if (retirementSetting) {
    const incomeMonths  = new Set(budgets.filter(b => b.type === "income").map(b => `${b.year}-${b.month}`));
    const expenseMonths = new Set(budgets.filter(b => b.type === "expense").map(b => `${b.year}-${b.month}`));
    const totalIncome   = budgets.filter(b => b.type === "income").reduce((s, b) => s + b.amount, 0);
    const totalExpense  = budgets.filter(b => b.type === "expense").reduce((s, b) => s + b.amount, 0);
    const avgIncome  = incomeMonths.size  > 0 ? totalIncome  / incomeMonths.size  : 0;
    const avgExpense = expenseMonths.size > 0 ? totalExpense / expenseMonths.size : 0;

    const r = calculateRetirement({
      currentAge:     retirementSetting.currentAge,
      retirementAge:  retirementSetting.retirementAge,
      lifeExpectancy: retirementSetting.lifeExpectancy,
      currentSavings: retirementSetting.currentSavings,
      expectedReturn: retirementSetting.expectedReturn,
      inflationRate:  retirementSetting.inflationRate,
      monthlyExpense: retirementSetting.monthlyExpense ?? (avgExpense > 0 ? avgExpense : 30000),
      monthlySavings: Math.max(0, avgIncome - avgExpense),
    });
    retirementProgress = r.progress;
    yearsToRetirement  = r.yearsToRetirement;
    requiredFund       = r.requiredFund;
    projectedFund      = r.projectedFund;
    shortfall          = r.shortfall;
  }

  const progressColor  = retirementProgress >= 80 ? "text-emerald-600" : retirementProgress >= 50 ? "text-amber-600" : "text-rose-500";
  const activeTrips    = trips.filter(t => t.status === "planning" || t.status === "booked").length;
  const completedTrips = trips.filter(t => t.status === "completed").length;
  const nextTrip       = trips.find(t => t.status === "booked") ?? trips.find(t => t.status === "planning");
  const recentTrips    = trips.slice(0, 3);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl space-y-6 lg:space-y-8">

      {/* ── Header ── */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-2xl px-6 py-5 text-white overflow-hidden shadow-lg shadow-indigo-500/20">
        <div className="absolute -top-10 -right-10 w-56 h-56 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-violet-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-indigo-200 text-xs font-medium tracking-wide">{greeting}</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              {session.user?.name || session.user?.email}
            </h1>
            <p className="text-indigo-300/80 text-sm mt-0.5">
              {MONTH_NAMES[now.getMonth()]} {now.getFullYear()}
            </p>
          </div>
          <div className="hidden sm:flex shrink-0 w-11 h-11 rounded-2xl bg-white/15 border border-white/20 items-center justify-center">
            <svg className="w-5 h-5 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 16l4.553-2.276A1 1 0 0021 19.382V8.618a1 1 0 00-.553-.894L15 5m0 18V5m0 0L9 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Top stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {[
          {
            label: "ความคืบหน้าเกษียณ",
            value: retirementSetting ? `${retirementProgress}%` : "–",
            sub: retirementSetting ? `เป้า ${fmtM(requiredFund)} ล้าน` : "ยังไม่ได้ตั้งค่า",
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            ),
            gradient: "from-indigo-500 to-violet-600",
            shadow: "shadow-indigo-500/30",
          },
          {
            label: "เหลืออีกกี่ปี",
            value: retirementSetting ? `${yearsToRetirement}` : "–",
            sub: retirementSetting ? `เกษียณอายุ ${retirementSetting.retirementAge} ปี` : "–",
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            gradient: "from-violet-500 to-purple-600",
            shadow: "shadow-violet-500/30",
          },
          {
            label: "ทริปที่วางแผน",
            value: String(activeTrips),
            sub: `เสร็จแล้ว ${completedTrips} ทริป`,
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            gradient: "from-sky-500 to-blue-600",
            shadow: "shadow-sky-500/30",
          },
          {
            label: "หมุดแผนที่",
            value: String(pinCount),
            sub: "สถานที่ที่ปักหมุด",
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            ),
            gradient: "from-emerald-500 to-teal-600",
            shadow: "shadow-emerald-500/30",
          },
        ].map(card => (
          <div key={card.label} className={`relative rounded-2xl p-5 bg-gradient-to-br ${card.gradient} text-white shadow-lg ${card.shadow} hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden`}>
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-black/5 rounded-full blur-xl pointer-events-none" />
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                {card.icon}
              </div>
              <p className="text-xs font-medium text-white/70 uppercase tracking-wide leading-none">{card.label}</p>
              <p className="text-2xl font-bold text-white mt-2 leading-none">{card.value}</p>
              <p className="text-xs text-white/60 mt-1.5">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main cards ── */}
      <div className="grid sm:grid-cols-2 gap-4 lg:gap-5">

        {/* Retirement card */}
        <Link href="/retirement"
          className="group bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:border-indigo-200 hover:shadow-lg hover:-translate-y-0.5 transition-all space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">แผนเกษียณ</p>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                {retirementSetting ? `เกษียณอายุ ${retirementSetting.retirementAge} ปี` : "ตั้งค่าแผนเกษียณ"}
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 text-indigo-500 flex items-center justify-center transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {retirementSetting ? (
            <div className="flex items-center gap-5">
              {/* Circular progress */}
              <div className="relative shrink-0">
                <CircleProgress pct={retirementProgress} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-sm font-bold ${progressColor}`}>{retirementProgress}%</span>
                </div>
              </div>

              <div className="flex-1 space-y-2.5 min-w-0">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">มีอยู่แล้ว</span>
                  <span className="font-semibold text-slate-700">{fmtM(projectedFund)} ล้าน</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">เป้าหมาย</span>
                  <span className="font-semibold text-slate-700">{fmtM(requiredFund)} ล้าน</span>
                </div>
                {shortfall > 0 ? (
                  <div className="flex justify-between text-xs">
                    <span className="text-amber-600">ขาดอีก</span>
                    <span className="font-semibold text-amber-600">{fmtM(shortfall)} ล้าน</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-semibold">แผนการออมเพียงพอแล้ว</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-indigo-50 rounded-xl p-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-500 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-sm text-indigo-700 font-medium">เริ่มตั้งค่าแผนเกษียณเพื่อดูความคืบหน้า</p>
            </div>
          )}
        </Link>

        {/* Travel card */}
        <Link href="/trips"
          className="group bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:border-violet-200 hover:shadow-lg hover:-translate-y-0.5 transition-all space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">แผนเดินทาง</p>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                {trips.length === 0 ? "ยังไม่มีทริป" : `${trips.length} ทริปทั้งหมด`}
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-violet-50 group-hover:bg-violet-100 text-violet-500 flex items-center justify-center transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {trips.length === 0 ? (
            <div className="flex items-center gap-3 bg-violet-50 rounded-xl p-4">
              <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-500 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-sm text-violet-700 font-medium">เพิ่มทริปแรกของคุณ</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTrips.map(trip => {
                const nights = trip.startDate && trip.endDate
                  ? Math.round((new Date(trip.endDate as unknown as Date).getTime() - new Date(trip.startDate as unknown as Date).getTime()) / 86400000)
                  : null;
                return (
                  <div key={trip.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[trip.status]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{trip.name}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {trip.destination}
                        {trip.startDate && ` · ${fmtDate(trip.startDate as unknown as Date)}`}
                        {nights != null && nights > 0 && ` · ${nights} คืน`}
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0 ${STATUS_BADGE[trip.status]}`}>
                      {STATUS_LABEL[trip.status]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Link>
      </div>

      {/* ── Map shortcut ── */}
      <Link href="/map"
        className="group flex items-center justify-between bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-4 hover:border-emerald-200 hover:shadow-lg hover:-translate-y-0.5 transition-all">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 text-emerald-500 flex items-center justify-center transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">แผนที่ท่องเที่ยว</p>
            <p className="text-xs text-slate-400 mt-0.5">ปักหมุดสถานที่ที่อยากไป</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xl font-bold text-emerald-600">{pinCount}</p>
            <p className="text-[10px] text-slate-400">สถานที่</p>
          </div>
          <svg className="w-4 h-4 text-slate-300 group-hover:text-emerald-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>

    </div>
  );
}
