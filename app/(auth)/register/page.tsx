"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "เกิดข้อผิดพลาด");
    } else {
      router.push("/login?registered=true");
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex w-[480px] shrink-0 bg-[#0f172a] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/15 via-transparent to-indigo-600/10" />
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-violet-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-indigo-500/8 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 16l4.553-2.276A1 1 0 0021 19.382V8.618a1 1 0 00-.553-.894L15 5m0 18V5m0 0L9 7" />
            </svg>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">My Plan</span>
        </div>

        {/* Hero */}
        <div className="relative space-y-5">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            <span className="text-slate-400 text-xs font-medium">เริ่มต้นฟรี ไม่มีค่าใช้จ่าย</span>
          </div>
          <h2 className="text-4xl font-bold text-white leading-[1.2] tracking-tight">
            เริ่มวางแผน<br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              ชีวิตของคุณ
            </span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            สร้างบัญชีฟรีแล้วเริ่มวางแผนเกษียณและท่องเที่ยวได้ทันที
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              { label: "แผนเกษียณ", sub: "คำนวณยอดที่ต้องมี", color: "border-indigo-500/30 bg-indigo-500/5" },
              { label: "แผนท่องเที่ยว", sub: "จัดการทริปและงบ", color: "border-violet-500/30 bg-violet-500/5" },
            ].map(f => (
              <div key={f.label} className={`border rounded-xl p-3 ${f.color}`}>
                <p className="text-white text-xs font-semibold">{f.label}</p>
                <p className="text-slate-500 text-[10px] mt-0.5">{f.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-4 text-slate-600 text-xs">
          <span>✦ ใช้งานฟรี</span>
          <span>✦ ข้อมูลปลอดภัย</span>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-[360px] space-y-7">

          <div className="lg:hidden flex items-center gap-2.5 justify-center mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 16l4.553-2.276A1 1 0 0021 19.382V8.618a1 1 0 00-.553-.894L15 5m0 18V5m0 0L9 7" />
              </svg>
            </div>
            <span className="text-slate-900 font-bold text-lg">My Plan</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">สมัครสมาชิก</h1>
            <p className="text-slate-500 text-sm mt-1">สร้างบัญชีใหม่ของคุณ</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                ชื่อ <span className="text-slate-400 font-normal">(ไม่บังคับ)</span>
              </label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 shadow-sm"
                placeholder="ชื่อของคุณ" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">อีเมล</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 shadow-sm"
                placeholder="you@example.com" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">รหัสผ่าน</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 shadow-sm"
                placeholder="อย่างน้อย 6 ตัวอักษร" />
            </div>

            {error && (
              <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3">
                <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-rose-600 text-sm">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white py-3 rounded-2xl font-semibold text-sm shadow-lg shadow-indigo-500/25 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  กำลังสมัคร...
                </span>
              ) : "สร้างบัญชี"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500">
            มีบัญชีแล้ว?{" "}
            <Link href="/login" className="text-indigo-600 font-semibold hover:text-indigo-500">
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
