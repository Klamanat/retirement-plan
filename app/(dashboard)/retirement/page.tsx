"use client";

import { useState, useEffect, useMemo, memo } from "react";
import { calculateRetirement } from "@/lib/retirementCalc";

const fmt  = (n: number) => new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(n);
const fmtM = (n: number) => new Intl.NumberFormat("th-TH", { maximumFractionDigits: 1 }).format(n / 1_000_000);

// ── sub-components ────────────────────────────────────────────────────────────

const SliderField = memo(function SliderField({
  label, value, onChange, min, max, step = 1, unit, sublabel,
}: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step?: number; unit: string; sublabel?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <span className="text-xs font-semibold text-slate-800">{value} {unit}</span>
      </div>
      <input type="range" value={value} min={min} max={max} step={step}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 accent-indigo-500 cursor-pointer" />
      {sublabel && <p className="text-[10px] text-slate-400">{sublabel}</p>}
    </div>
  );
});

function Arrow() {
  return (
    <div className="flex justify-center py-1">
      <div className="flex flex-col items-center gap-0.5 text-slate-300">
        <div className="w-px h-5 bg-slate-200" />
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 12 12">
          <path d="M6 10L1 4h10z" />
        </svg>
      </div>
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────

export default function RetirementPage() {
  // ── personal ──
  const [currentAge,     setCurrentAge]     = useState(30);
  const [retirementAge,  setRetirementAge]  = useState(60);
  const [lifeExpectancy, setLifeExpectancy] = useState(85);

  // ── expense (drives the target) ──
  const [avgExpense,      setAvgExpense]      = useState(0);     // from budget (or manual)
  const [manualExpense,   setManualExpense]   = useState<number | null>(null); // manual override
  const [lifestyleFactor, setLifestyleFactor] = useState(1.0);  // 0.5–2.0

  // ── savings ──
  const [currentSavings,  setCurrentSavings]  = useState(0);
  const [avgIncome,        setAvgIncome]        = useState(0);   // from budget
  const [manualSavings,   setManualSavings]    = useState<number | null>(null);

  // ── assumptions ──
  const [expectedReturn, setExpectedReturn] = useState(5);
  const [inflationRate,  setInflationRate]  = useState(3);

  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/retirement").then(r => r.json()).then(data => {
      if (data.setting) {
        const s = data.setting;
        setCurrentAge(s.currentAge);
        setRetirementAge(s.retirementAge);
        setLifeExpectancy(s.lifeExpectancy);
        setCurrentSavings(s.currentSavings);
        setExpectedReturn(s.expectedReturn);
        setInflationRate(s.inflationRate);
        if (s.monthlyExpense && data.avgMonthlyExpense > 0) {
          setLifestyleFactor(parseFloat((s.monthlyExpense / data.avgMonthlyExpense).toFixed(2)));
        }
      }
      setAvgIncome(data.avgMonthlyIncome);
      setAvgExpense(data.avgMonthlyExpense);
      setLoaded(true);
    });
  }, []);

  // ── derived values ──
  // ค่าใช้จ่ายหลังเกษียณ = ค่าใช้จ่ายปัจจุบัน × lifestyle factor
  const baseExpense = manualExpense !== null ? manualExpense : (avgExpense > 0 ? avgExpense : 30000);
  const retirementExpense = Math.round(baseExpense * lifestyleFactor);

  // เงินออมต่อเดือนปัจจุบัน: จากข้อมูล budget หรือ manual
  const monthlySavings =
    manualSavings !== null
      ? manualSavings
      : Math.max(0, avgIncome - avgExpense);

  const result = useMemo(() => calculateRetirement({
    currentAge, retirementAge, lifeExpectancy,
    currentSavings, expectedReturn, inflationRate,
    monthlyExpense: retirementExpense,
    monthlySavings,
  }), [currentAge, retirementAge, lifeExpectancy, currentSavings,
       expectedReturn, inflationRate, retirementExpense, monthlySavings]);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/retirement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentAge, retirementAge, lifeExpectancy, currentSavings,
        expectedReturn, inflationRate,
        monthlyExpense: retirementExpense,
      }),
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const progressColor =
    result.progress >= 80 ? "bg-emerald-500" :
    result.progress >= 50 ? "bg-amber-400"   : "bg-rose-500";

  const progressTextColor =
    result.progress >= 80 ? "text-emerald-600" :
    result.progress >= 50 ? "text-amber-600"   : "text-rose-600";

  if (!loaded) return (
    <div className="flex items-center justify-center h-64 text-slate-400 text-sm animate-pulse">
      กำลังโหลด...
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl space-y-6 lg:space-y-8">

      {/* Header */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-2xl px-6 py-5 text-white overflow-hidden shadow-lg shadow-indigo-500/20">
        <div className="absolute -top-10 -right-10 w-56 h-56 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 mb-2">
              <svg className="w-3.5 h-3.5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-indigo-200 text-xs font-medium tracking-wide">แผนเกษียณ</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">วางแผนการเงินเพื่อเกษียณ</h1>
            <p className="text-indigo-300/80 text-xs mt-0.5">คำนวณจากค่าใช้จ่าย → ยอดเงินเป้าหมาย</p>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 bg-white text-indigo-700 hover:bg-indigo-50 shadow-lg">
            {saved ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                บันทึกแล้ว
              </>
            ) : saving ? "..." : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                บันทึก
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-5 lg:gap-8 items-start">

        {/* ════ LEFT: CALCULATION FLOW ════ */}
        <div className="space-y-3">

          {/* ── STEP 1: ค่าใช้จ่าย ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 bg-gradient-to-r from-rose-50 to-pink-50 border-b border-rose-100/60 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 text-white text-xs flex items-center justify-center font-bold shrink-0 shadow-sm shadow-rose-500/25">1</span>
              <p className="text-sm font-semibold text-rose-800">ค่าใช้จ่ายหลังเกษียณ</p>
            </div>
            <div className="p-5 space-y-4">
              {/* Source */}
              <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                <div>
                  <p className="text-xs text-slate-500">ค่าใช้จ่ายเฉลี่ยปัจจุบัน</p>
                  <p className="text-slate-400 text-[10px]">
                    {manualExpense !== null ? "กรอกเอง" : avgExpense > 0 ? "จากข้อมูลงบประมาณ" : "ค่าเริ่มต้น"}
                  </p>
                </div>
                <p className="text-lg font-bold text-slate-700">
                  {fmt(baseExpense)} <span className="text-sm font-normal text-slate-400">฿/เดือน</span>
                </p>
              </div>

              {/* Lifestyle factor */}
              <div className="space-y-3">
                <SliderField
                  label="ปรับระดับค่าใช้จ่ายหลังเกษียณ"
                  value={lifestyleFactor} onChange={setLifestyleFactor}
                  min={0.5} max={2.0} step={0.05} unit="×"
                  sublabel={
                    lifestyleFactor < 0.9 ? "ใช้ชีวิตเรียบง่ายกว่าปัจจุบัน" :
                    lifestyleFactor > 1.1 ? "ใช้ชีวิตดีกว่าปัจจุบัน" :
                    "ใช้ชีวิตในระดับเดิม"
                  }
                />
                <div className="flex justify-between text-xs px-1">
                  {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(v => (
                    <button key={v} onClick={() => setLifestyleFactor(v)}
                      className={`px-1.5 py-0.5 rounded text-[10px] transition
                        ${lifestyleFactor === v ? "bg-indigo-100 text-indigo-700 font-semibold" : "text-slate-400 hover:text-slate-600"}`}>
                      {v}×
                    </button>
                  ))}
                </div>
              </div>

              {/* Result */}
              <div className="bg-rose-50 rounded-xl px-4 py-3 flex justify-between items-center">
                <p className="text-xs font-medium text-rose-700">ค่าใช้จ่ายหลังเกษียณ</p>
                <p className="text-xl font-bold text-rose-700">
                  {fmt(retirementExpense)} <span className="text-sm font-normal">฿/เดือน</span>
                </p>
              </div>
            </div>
          </div>

          <Arrow />

          {/* ── STEP 2: ยอดเงินเป้าหมาย ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-indigo-100/60 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs flex items-center justify-center font-bold shrink-0 shadow-sm shadow-indigo-500/25">2</span>
              <p className="text-sm font-semibold text-indigo-800">ยอดเงินที่ต้องมีตอนเกษียณ</p>
            </div>
            <div className="p-5 space-y-4">
              {/* Formula hint */}
              <div className="text-xs text-slate-500 bg-slate-50 rounded-xl px-4 py-3 space-y-1">
                <p className="font-medium text-slate-600">วิธีคำนวณ (PV of Annuity)</p>
                <p>{fmt(retirementExpense)} ฿/เดือน × {result.yearsInRetirement * 12} เดือน ÷ ปรับผลตอบแทนจริง {result.realReturnRate}%/ปี</p>
                <p className="text-slate-400">ใช้จ่ายได้ {result.yearsInRetirement} ปี ({retirementAge}–{lifeExpectancy} ปี)</p>
              </div>

              {/* Target fund */}
              <div className="bg-indigo-50 rounded-xl px-4 py-4 text-center">
                <p className="text-xs font-medium text-indigo-600 mb-1">ยอดเงินเป้าหมาย</p>
                <p className="text-3xl font-bold text-indigo-700">{fmtM(result.requiredFund)}</p>
                <p className="text-sm text-indigo-500 mt-0.5">ล้านบาท ({fmt(result.requiredFund)} ฿)</p>
              </div>
            </div>
          </div>

          <Arrow />

          {/* ── STEP 3: ช่องว่าง ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100/60 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs flex items-center justify-center font-bold shrink-0 shadow-sm shadow-emerald-500/25">3</span>
              <p className="text-sm font-semibold text-emerald-800">ช่องว่างและแผนออม</p>
            </div>
            <div className="p-5 space-y-4">
              {/* Gap visual */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>เงินที่คาดว่าจะมี</span>
                  <span className="font-medium text-slate-700">{fmtM(result.projectedFund)} ล้าน</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div className={`h-3 rounded-full transition-all duration-700 bg-gradient-to-r ${
                    result.progress >= 80 ? "from-emerald-400 to-teal-500" :
                    result.progress >= 50 ? "from-amber-400 to-orange-400" :
                    "from-rose-400 to-pink-500"
                  }`}
                    style={{ width: `${Math.min(100, result.progress)}%` }} />
                </div>
                <div className="flex justify-between text-xs">
                  <span className={`font-semibold ${progressTextColor}`}>{result.progress}% ของเป้าหมาย</span>
                  <span className="text-slate-400">เป้า {fmtM(result.requiredFund)} ล้าน</span>
                </div>
              </div>

              {/* Savings breakdown */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 rounded-xl px-3 py-2.5">
                  <p className="text-slate-400">เงินออมปัจจุบัน (FV)</p>
                  <p className="font-semibold text-slate-700 mt-0.5">{fmt(result.fvCurrentSavings)} ฿</p>
                </div>
                <div className="bg-slate-50 rounded-xl px-3 py-2.5">
                  <p className="text-slate-400">จากการออมต่อเดือน</p>
                  <p className="font-semibold text-slate-700 mt-0.5">
                    {fmt(result.projectedFund - result.fvCurrentSavings)} ฿
                  </p>
                </div>
              </div>

              {/* Savings input */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-600">เงินออมต่อเดือนปัจจุบัน</p>
                  {avgIncome > 0 && manualSavings === null && (
                    <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                      จากข้อมูล budget
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input type="number"
                    value={manualSavings !== null ? manualSavings : Math.max(0, avgIncome - avgExpense)}
                    onChange={e => setManualSavings(parseFloat(e.target.value) || 0)}
                    min={0} step={1000}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />
                  <span className="text-xs text-slate-400 shrink-0">฿/เดือน</span>
                  {manualSavings !== null && avgIncome > 0 && (
                    <button onClick={() => setManualSavings(null)}
                      className="text-[10px] text-indigo-500 hover:text-indigo-700 shrink-0 underline">
                      reset
                    </button>
                  )}
                </div>
              </div>

              {/* Required monthly savings */}
              <div className={`rounded-xl px-4 py-4 ${
                result.shortfall <= 0
                  ? "bg-emerald-50 border border-emerald-200"
                  : "bg-amber-50 border border-amber-200"
              }`}>
                {result.shortfall <= 0 ? (
                  <div className="text-center">
                    <p className="text-sm font-semibold text-emerald-700">✓ แผนการออมเพียงพอแล้ว</p>
                    <p className="text-xs text-emerald-600 mt-1">
                      เกินเป้า {fmt(result.projectedFund - result.requiredFund)} ฿
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <p className="text-xs font-medium text-amber-700">ต้องออมเพิ่มต่อเดือน</p>
                      <p className="text-xl font-bold text-amber-700">
                        {fmt(result.requiredMonthlySavings)} <span className="text-sm font-normal">฿</span>
                      </p>
                    </div>
                    <div className="flex justify-between text-xs text-amber-600/80">
                      <span>ออมอยู่: {fmt(monthlySavings)} ฿</span>
                      <span>ขาดอีก: {fmt(Math.max(0, result.requiredMonthlySavings - monthlySavings))} ฿/เดือน</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ════ RIGHT: SETTINGS ════ */}
        <div className="space-y-4 lg:sticky lg:top-8">

          {/* Ages */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500" />
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">ข้อมูลส่วนตัว</p>
            </div>
            <SliderField label="อายุปัจจุบัน" value={currentAge} onChange={setCurrentAge}
              min={18} max={79} unit="ปี" />
            <SliderField label="อายุเกษียณ" value={retirementAge}
              onChange={v => setRetirementAge(Math.max(currentAge + 1, v))}
              min={currentAge + 1} max={80} unit="ปี"
              sublabel={`อีก ${result.yearsToRetirement} ปี`} />
            <SliderField label="อายุขัยที่ตั้งไว้" value={lifeExpectancy}
              onChange={v => setLifeExpectancy(Math.max(retirementAge + 1, v))}
              min={retirementAge + 1} max={120} unit="ปี"
              sublabel={`ใช้เงิน ${result.yearsInRetirement} ปีหลังเกษียณ`} />
          </div>

          {/* Savings */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-sky-500 to-blue-500" />
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">เงินออมปัจจุบัน</p>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-xs font-medium text-slate-600">เงินออม/ลงทุนปัจจุบัน</span>
                <span className="text-xs font-semibold text-slate-800">{fmt(currentSavings)} ฿</span>
              </div>
              <input type="number" value={currentSavings}
                onChange={e => setCurrentSavings(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                placeholder="0" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-slate-600">ค่าใช้จ่าย/เดือนปัจจุบัน</span>
                {avgExpense > 0 && manualExpense === null && (
                  <span className="text-[10px] bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full">auto</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input type="number"
                  value={manualExpense !== null ? manualExpense : (avgExpense > 0 ? avgExpense : 30000)}
                  onChange={e => setManualExpense(parseFloat(e.target.value) || 0)}
                  min={0} step={1000}
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />
                {manualExpense !== null && (
                  <button onClick={() => setManualExpense(null)}
                    className="text-[10px] text-indigo-500 hover:text-indigo-700 shrink-0 underline">
                    reset
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-400">ใช้คำนวณค่าใช้จ่ายหลังเกษียณ</p>
            </div>
          </div>

          {/* Assumptions */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-amber-400 to-orange-500" />
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">สมมติฐาน</p>
            </div>
            <SliderField label="ผลตอบแทนการลงทุน" value={expectedReturn}
              onChange={setExpectedReturn} min={0} max={20} step={0.5} unit="%/ปี" />
            <SliderField label="อัตราเงินเฟ้อ" value={inflationRate}
              onChange={setInflationRate} min={0} max={15} step={0.5} unit="%/ปี" />
            <div className="bg-slate-50 rounded-xl px-3 py-2 text-xs text-slate-500 text-center">
              ผลตอบแทนจริง = <span className="font-semibold text-slate-700">{result.realReturnRate}%</span>/ปี
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-emerald-500 to-teal-500" />
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">ไทม์ไลน์</p>
            </div>
            <div className="space-y-0">
              {[
                { label: "ปัจจุบัน", age: currentAge, sub: `ออม ${fmt(monthlySavings)} ฿/เดือน`, dot: "bg-slate-400" },
                { label: "เกษียณ",   age: retirementAge,
                  sub: `มีเงิน ${fmtM(result.projectedFund)} ล้าน`,
                  dot: result.projectedFund >= result.requiredFund ? "bg-emerald-500" : "bg-amber-400" },
                { label: "สิ้นสุดแผน", age: lifeExpectancy,
                  sub: `ใช้จ่ายไป ${fmtM(retirementExpense * 12 * result.yearsInRetirement)} ล้าน`,
                  dot: "bg-slate-300" },
              ].map((item, i, arr) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1 ${item.dot} shrink-0`} />
                    {i < arr.length - 1 && <div className="w-px flex-1 bg-slate-200 my-1" />}
                  </div>
                  <div className={`pb-4 ${i === arr.length - 1 ? "pb-0" : ""}`}>
                    <p className="text-xs font-semibold text-slate-800">
                      {item.label} <span className="font-normal text-slate-400">· อายุ {item.age} ปี</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
