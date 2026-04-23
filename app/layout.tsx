import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "My Plan — แผนเกษียณ & ท่องเที่ยว",
  description: "วางแผนเกษียณและท่องเที่ยวในที่เดียว",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={geist.variable}>
      <body className="min-h-screen bg-slate-50 font-sans">{children}</body>
    </html>
  );
}
