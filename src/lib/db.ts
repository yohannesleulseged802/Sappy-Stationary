import { PrismaClient } from "@prisma/client";
import { ensureSchema } from "./schema-heal";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: ["error"], errorFormat: "pretty" });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Self-healing: run on every import (cheap after first time)
let healed = false;
export async function safeDb() {
  if (!healed) {
    try {
      await ensureSchema(prisma);
      healed = true;
    } catch (e) {
      console.error("Schema heal failed:", e);
    }
  }
  return prisma;
}