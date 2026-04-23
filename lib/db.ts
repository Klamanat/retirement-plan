import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDbUrl(): string {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && envUrl.startsWith("file:")) {
    const filePart = envUrl.slice(5); // remove "file:"
    // If already absolute, use as-is
    if (filePart.startsWith("/") || /^[A-Za-z]:/.test(filePart)) {
      return envUrl;
    }
    // Convert relative path to absolute using process.cwd()
    const rel = filePart.startsWith("./") ? filePart.slice(2) : filePart;
    const abs = `${process.cwd()}/${rel}`.replace(/\\/g, "/");
    return `file:${abs}`;
  }
  return `file:${process.cwd()}/dev.db`.replace(/\\/g, "/");
}

function createPrismaClient() {
  const adapter = new PrismaLibSql({ url: getDbUrl() });
  return new PrismaClient({ adapter } as any);
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
