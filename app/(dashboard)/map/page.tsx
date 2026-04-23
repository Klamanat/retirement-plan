"use client";

import dynamic from "next/dynamic";

const MapClient = dynamic(() => import("@/components/MapClient"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-slate-400 text-sm animate-pulse">
      กำลังโหลดแผนที่...
    </div>
  ),
});

export default function MapPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] lg:h-screen">
      <div className="px-4 sm:px-8 py-4 sm:py-5 bg-white border-b border-slate-100 shrink-0">
        <h1 className="text-xl font-bold text-slate-900">แผนที่ท่องเที่ยว</h1>
        <p className="text-slate-400 text-xs mt-0.5">คลิกบนแผนที่ หรือค้นหาชื่อสถานที่เพื่อเพิ่มหมุด</p>
      </div>
      <div className="flex-1 min-h-0">
        <MapClient />
      </div>
    </div>
  );
}
