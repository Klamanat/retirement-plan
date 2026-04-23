# My Plan — แผนเกษียณ & ท่องเที่ยว

แอปวางแผนชีวิตครบวงจร สำหรับคนที่อยากจัดการ **แผนเกษียณ** และ **ทริปท่องเที่ยว** ในที่เดียว

## ฟีเจอร์

- **แผนเกษียณ** — คำนวณยอดเงินที่ต้องมีตอนเกษียณ พร้อม slider ปรับค่าแบบ real-time
- **แผนเดินทาง** — จัดการทริป งบประมาณ และสถานะ (วางแผน / จองแล้ว / เสร็จแล้ว)
- **แผนที่** — ปักหมุดสถานที่บน interactive map พร้อมค้นหาผ่าน Nominatim
- **งบประมาณ** — บันทึกรายรับ-รายจ่ายรายเดือน พร้อมกราฟ bar chart

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4 |
| Font | Inter (self-hosted via `next/font`) |
| Auth | NextAuth.js v5 (Credentials) |
| Database | SQLite (LibSQL) + Prisma ORM v7 |
| Charts | Recharts |
| Maps | React Leaflet + OpenStreetMap |

## เริ่มต้นใช้งาน

### 1. ติดตั้ง dependencies

```bash
npm install
```

### 2. ตั้งค่า environment variables

สร้างไฟล์ `.env.local`:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="your-secret-key"
```

### 3. สร้าง database

```bash
npx prisma migrate dev
```

### 4. รัน development server

```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000) ในเบราว์เซอร์

## โครงสร้างโปรเจค

```
app/
├── (auth)/
│   ├── login/          # หน้าเข้าสู่ระบบ
│   └── register/       # หน้าสมัครสมาชิก
├── (dashboard)/
│   ├── dashboard/      # ภาพรวม
│   ├── retirement/     # แผนเกษียณ
│   ├── trips/          # แผนเดินทาง
│   └── map/            # แผนที่
└── api/                # API routes

components/
├── SidebarShell.tsx    # Sidebar layout
├── SidebarNav.tsx      # Navigation links
├── MapClient.tsx       # Interactive map
├── YearlyChart.tsx     # Budget bar chart
└── PinModal.tsx        # Modal เพิ่มหมุด

prisma/
└── schema.prisma       # Database schema
```

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint
```
