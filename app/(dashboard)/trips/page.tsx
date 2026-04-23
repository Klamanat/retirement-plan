"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  spent: number;
  status: string;
  note: string | null;
  createdAt: string;
}

type Status = "planning" | "booked" | "completed" | "cancelled";

const STATUS_LABEL: Record<string, string> = {
  planning: "วางแผน", booked: "จองแล้ว", completed: "เสร็จแล้ว", cancelled: "ยกเลิก",
};
const STATUS_BG: Record<string, string> = {
  planning:  "bg-indigo-50 text-indigo-700 border-indigo-100",
  booked:    "bg-amber-50 text-amber-700 border-amber-100",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
  cancelled: "bg-slate-50 text-slate-500 border-slate-200",
};
const STATUS_DOT: Record<string, string> = {
  planning: "bg-indigo-400", booked: "bg-amber-400", completed: "bg-emerald-400", cancelled: "bg-slate-300",
};
const STATUS_STRIPE: Record<string, string> = {
  planning: "bg-indigo-500", booked: "bg-amber-500", completed: "bg-emerald-500", cancelled: "bg-slate-300",
};

const fmt = (n: number) => new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(n);
const fmtDate = (s: string | null) => {
  if (!s) return null;
  return new Date(s).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
};

const EMPTY: { name: string; destination: string; startDate: string; endDate: string; budget: string; spent: string; status: Status; note: string } = {
  name: "", destination: "", startDate: "", endDate: "", budget: "", spent: "0", status: "planning", note: "",
};

export default function TripsPage() {
  const [trips,     setTrips]     = useState<Trip[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editId,    setEditId]    = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | Status>("all");
  const [form,      setForm]      = useState({ ...EMPTY });
  const [saving,    setSaving]    = useState(false);

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/trips");
    if (res.ok) setTrips(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  const stats = useMemo(() => ({
    total:      trips.length,
    budget:     trips.reduce((s, t) => s + (t.budget ?? 0), 0),
    spent:      trips.reduce((s, t) => s + t.spent, 0),
    completed:  trips.filter(t => t.status === "completed").length,
  }), [trips]);

  const filtered = useMemo(() =>
    activeTab === "all" ? trips : trips.filter(t => t.status === activeTab),
  [trips, activeTab]);

  const openNew = () => { setEditId(null); setForm({ ...EMPTY }); setShowForm(true); };
  const openEdit = (t: Trip) => {
    setEditId(t.id);
    setForm({
      name: t.name, destination: t.destination,
      startDate: t.startDate?.slice(0, 10) ?? "",
      endDate:   t.endDate?.slice(0, 10)   ?? "",
      budget: t.budget != null ? String(t.budget) : "",
      spent:  String(t.spent),
      status: t.status as Status, note: t.note ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.destination.trim()) return;
    setSaving(true);
    const body = { name: form.name, destination: form.destination, startDate: form.startDate || null, endDate: form.endDate || null, budget: form.budget || null, spent: form.spent || "0", status: form.status, note: form.note || null };
    if (editId) {
      await fetch(`/api/trips?id=${editId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } else {
      await fetch("/api/trips", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    }
    setSaving(false); setShowForm(false); setEditId(null); fetchTrips();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบทริปนี้?")) return;
    await fetch(`/api/trips?id=${id}`, { method: "DELETE" });
    fetchTrips();
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const TABS: Array<{ key: "all" | Status; label: string }> = [
    { key: "all", label: "ทั้งหมด" },
    { key: "planning", label: "วางแผน" },
    { key: "booked", label: "จองแล้ว" },
    { key: "completed", label: "เสร็จแล้ว" },
    { key: "cancelled", label: "ยกเลิก" },
  ];

  const inputCls = "w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 shadow-sm placeholder:text-slate-400";

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 lg:space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">แผนเดินทาง</h1>
          <p className="text-slate-400 text-sm mt-0.5">จัดการทริปและงบประมาณท่องเที่ยว</p>
        </div>
        <button onClick={openNew}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition
            ${showForm && !editId
              ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
              : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-500/20"}`}>
          {showForm && !editId ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              ปิด
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              เพิ่มทริป
            </>
          )}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {[
          { label: "ทริปทั้งหมด", value: stats.total, unit: "ทริป", from: "from-indigo-500", to: "to-violet-500" },
          { label: "งบประมาณรวม", value: fmt(stats.budget), unit: "฿", from: "from-violet-500", to: "to-purple-500" },
          { label: "ใช้จ่ายไปแล้ว", value: fmt(stats.spent), unit: "฿", from: "from-rose-500", to: "to-pink-500" },
          { label: "เสร็จแล้ว", value: stats.completed, unit: "ทริป", from: "from-emerald-500", to: "to-teal-500" },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className={`w-8 h-1 rounded-full bg-gradient-to-r ${c.from} ${c.to} mb-4`} />
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{c.label}</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{c.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{c.unit}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 text-sm">{editId ? "แก้ไขทริป" : "เพิ่มทริปใหม่"}</h2>
            <button onClick={() => { setShowForm(false); setEditId(null); }}
              className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">ชื่อทริป *</label>
                <input value={form.name} onChange={set("name")} required placeholder="เช่น ญี่ปุ่นฤดูใบไม้ร่วง" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">ปลายทาง *</label>
                <input value={form.destination} onChange={set("destination")} required placeholder="เช่น โตเกียว, ญี่ปุ่น" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">วันที่เริ่ม</label>
                <input type="date" value={form.startDate} onChange={set("startDate")} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">วันที่สิ้นสุด</label>
                <input type="date" value={form.endDate} onChange={set("endDate")} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">งบประมาณ (฿)</label>
                <input type="number" value={form.budget} onChange={set("budget")} min={0} step={1000} placeholder="0" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">ค่าใช้จ่ายจริง (฿)</label>
                <input type="number" value={form.spent} onChange={set("spent")} min={0} step={100} placeholder="0" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">สถานะ</label>
                <select value={form.status} onChange={set("status")} className={`${inputCls} bg-white`}>
                  <option value="planning">วางแผน</option>
                  <option value="booked">จองแล้ว</option>
                  <option value="completed">เสร็จแล้ว</option>
                  <option value="cancelled">ยกเลิก</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">หมายเหตุ</label>
                <input value={form.note} onChange={set("note")} placeholder="หมายเหตุเพิ่มเติม" className={inputCls} />
              </div>
            </div>
            <div className="flex gap-3 mt-5 pt-5 border-t border-slate-100">
              <button type="submit" disabled={saving}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold rounded-xl shadow-sm shadow-indigo-500/20 disabled:opacity-60">
                {saving ? "กำลังบันทึก..." : editId ? "บันทึกการแก้ไข" : "เพิ่มทริป"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); }}
                className="px-4 py-2.5 text-slate-500 hover:text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-100 transition">
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white border border-slate-100 rounded-xl p-1 w-full sm:w-fit shadow-sm overflow-x-auto">
        {TABS.map(tab => {
          const count = tab.key === "all" ? trips.length : trips.filter(t => t.status === tab.key).length;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5
                ${activeTab === tab.key ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}>
              {tab.label}
              <span className={`text-[10px] ${activeTab === tab.key ? "opacity-70" : "opacity-50"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Trip list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-sm text-slate-400">กำลังโหลด...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-600">ยังไม่มีทริป</p>
            <p className="text-xs text-slate-400 mt-0.5">กดปุ่ม &ldquo;เพิ่มทริป&rdquo; เพื่อเริ่มวางแผน</p>
          </div>
          <button onClick={openNew}
            className="mt-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-sm transition">
            + เพิ่มทริปแรก
          </button>
        </div>
      ) : (
        <div className="grid gap-3 lg:gap-4 sm:grid-cols-2">
          {filtered.map(trip => {
            const pct    = trip.budget && trip.budget > 0 ? Math.min(100, (trip.spent / trip.budget) * 100) : 0;
            const over   = trip.budget != null && trip.spent > trip.budget;
            const nights = trip.startDate && trip.endDate
              ? Math.round((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 86400000)
              : null;
            const sd = fmtDate(trip.startDate);
            const ed = fmtDate(trip.endDate);

            return (
              <div key={trip.id}
                className={`bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden
                  ${trip.status === "cancelled" ? "opacity-60" : ""}`}>
                {/* Colored top stripe */}
                <div className={`h-1 w-full ${STATUS_STRIPE[trip.status]}`} />

                <div className="p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-sm">{trip.name}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold shrink-0 ${STATUS_BG[trip.status]}`}>
                          <span className={`inline-block w-1 h-1 rounded-full mr-1 align-middle ${STATUS_DOT[trip.status]}`} />
                          {STATUS_LABEL[trip.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-xs text-slate-500 truncate">{trip.destination}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEdit(trip)}
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 flex items-center justify-center transition">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(trip.id)}
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Date */}
                  {(sd || ed) && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-xl px-3 py-2">
                      <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{sd ?? "–"} → {ed ?? "–"}</span>
                      {nights != null && nights > 0 && (
                        <span className="ml-auto bg-white border border-slate-200 px-1.5 py-0.5 rounded-lg text-[10px] font-medium text-slate-600">
                          {nights} คืน
                        </span>
                      )}
                    </div>
                  )}

                  {/* Budget */}
                  {trip.budget != null && trip.budget > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>ใช้ไป <span className={`font-semibold ${over ? "text-rose-600" : "text-slate-700"}`}>{fmt(trip.spent)}</span> ฿</span>
                        <span>งบ <span className="font-semibold text-slate-700">{fmt(trip.budget)}</span> ฿</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-500 ${over ? "bg-rose-500" : trip.status === "completed" ? "bg-emerald-500" : "bg-indigo-500"}`}
                          style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                      {over && (
                        <p className="text-[10px] font-semibold text-rose-600 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          เกินงบ {fmt(trip.spent - trip.budget)} ฿
                        </p>
                      )}
                    </div>
                  )}

                  {/* Note */}
                  {trip.note && (
                    <p className="text-xs text-slate-400 italic border-t border-slate-100 pt-3">&ldquo;{trip.note}&rdquo;</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
