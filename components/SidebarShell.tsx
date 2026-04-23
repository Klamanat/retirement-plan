"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import SidebarNav from "./SidebarNav";

interface Props {
  displayName: string;
  initials: string;
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/40 shrink-0">
        <svg className="w-[18px] h-[18px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 16l4.553-2.276A1 1 0 0021 19.382V8.618a1 1 0 00-.553-.894L15 5m0 18V5m0 0L9 7" />
        </svg>
      </div>
      <div>
        <p className="text-white font-bold text-sm tracking-tight leading-none">My Plan</p>
        <p className="text-slate-500 text-[10px] mt-0.5 leading-none tracking-wide">เกษียณ & ท่องเที่ยว</p>
      </div>
    </div>
  );
}

function SidebarContent({ displayName, initials, onNavigate }: Props & { onNavigate?: () => void }) {
  return (
    <>
      <div className="px-5 pt-6 pb-5">
        <Logo />
      </div>

      <SidebarNav onNavigate={onNavigate} />

      <div className="p-3 border-t border-white/5 mt-auto">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-slate-200 text-xs font-semibold truncate leading-tight">{displayName}</p>
            <p className="text-slate-500 text-[10px] leading-tight mt-0.5">สมาชิก</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-400/5 text-xs font-medium mt-0.5 transition"
        >
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          ออกจากระบบ
        </button>
      </div>
    </>
  );
}

export default function SidebarShell({ displayName, initials }: Props) {
  const [open, setOpen] = useState(false);

  // Close drawer on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* ── Desktop sidebar (always visible on lg+) ── */}
      <aside className="hidden lg:flex w-[260px] shrink-0 flex-col bg-[#0f172a] border-r border-white/5">
        <SidebarContent displayName={displayName} initials={initials} />
      </aside>

      {/* ── Mobile: fixed top bar ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-[#0f172a] border-b border-white/5 flex items-center gap-3 px-4">
        <button
          onClick={() => setOpen(true)}
          className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition shrink-0"
          aria-label="เปิดเมนู"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Logo />
      </div>

      {/* ── Mobile: drawer + backdrop ── */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Drawer */}
          <aside className="relative w-[260px] h-full flex flex-col bg-[#0f172a] border-r border-white/5 z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Close button */}
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 flex items-center justify-center transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <SidebarContent
              displayName={displayName}
              initials={initials}
              onNavigate={() => setOpen(false)}
            />
          </aside>
        </div>
      )}
    </>
  );
}
