import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function ensureSchema(db: PrismaClient) {
  const sql = `
    CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT PRIMARY KEY,
      "email" TEXT UNIQUE NOT NULL,
      "name" TEXT NOT NULL,
      "passwordHash" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'staff',
      "avatar" TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'staff';
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatar" TEXT;

    CREATE TABLE IF NOT EXISTS "InventoryItem" (
      "id" TEXT PRIMARY KEY,
      "serial" TEXT UNIQUE NOT NULL,
      "name" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "quantity" INTEGER NOT NULL DEFAULT 0,
      "location" TEXT,
      "cost" NUMERIC(14,2),
      "price" NUMERIC(14,2) NOT NULL,
      "costUnknown" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "userId" TEXT NOT NULL
    );
    ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "location" TEXT;
    ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "costUnknown" BOOLEAN NOT NULL DEFAULT false;

    CREATE TABLE IF NOT EXISTS "Sale" (
      "id" TEXT PRIMARY KEY,
      "invoiceNo" TEXT UNIQUE NOT NULL,
      "date" TIMESTAMPTZ NOT NULL,
      "backdated" BOOLEAN NOT NULL DEFAULT false,
      "paymentMethod" TEXT NOT NULL,
      "total" NUMERIC(14,2) NOT NULL,
      "discount" NUMERIC(14,2) NOT NULL DEFAULT 0,
      "refunded" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "userId" TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "SaleLine" (
      "id" TEXT PRIMARY KEY,
      "saleId" TEXT NOT NULL,
      "itemId" TEXT,
      "itemName" TEXT NOT NULL,
      "qty" INTEGER NOT NULL,
      "price" NUMERIC(14,2) NOT NULL,
      "cost" NUMERIC(14,2)
    );

    CREATE TABLE IF NOT EXISTS "Credit" (
      "id" TEXT PRIMARY KEY,
      "customer" TEXT NOT NULL,
      "item" TEXT NOT NULL,
      "amount" NUMERIC(14,2) NOT NULL,
      "date" TIMESTAMPTZ NOT NULL,
      "backdated" BOOLEAN NOT NULL DEFAULT false,
      "paid" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "userId" TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "PurchaseOrder" (
      "id" TEXT PRIMARY KEY,
      "poNumber" TEXT UNIQUE NOT NULL,
      "supplier" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'draft',
      "total" NUMERIC(14,2) NOT NULL DEFAULT 0,
      "date" TIMESTAMPTZ NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "userId" TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "PurchaseLine" (
      "id" TEXT PRIMARY KEY,
      "poId" TEXT NOT NULL,
      "itemName" TEXT NOT NULL,
      "qty" INTEGER NOT NULL,
      "cost" NUMERIC(14,2) NOT NULL,
      "itemId" TEXT
    );

    CREATE TABLE IF NOT EXISTS "Expense" (
      "id" TEXT PRIMARY KEY,
      "category" TEXT NOT NULL,
      "description" TEXT,
      "amount" NUMERIC(14,2) NOT NULL,
      "date" TIMESTAMPTZ NOT NULL,
      "backdated" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "userId" TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "Activity" (
      "id" TEXT PRIMARY KEY,
      "action" TEXT NOT NULL,
      "details" TEXT,
      "userId" TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS "DeviceSession" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "token" TEXT UNIQUE NOT NULL,
      "label" TEXT NOT NULL,
      "lastActive" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS "AppSettings" (
      "id" TEXT PRIMARY KEY DEFAULT 'singleton',
      "masterHash" TEXT NOT NULL,
      "lowStock" INTEGER NOT NULL DEFAULT 5,
      "businessName" TEXT NOT NULL DEFAULT 'Sappy Stationary',
      "currency" TEXT NOT NULL DEFAULT 'ETB',
      "ownerName" TEXT NOT NULL DEFAULT 'Yohannes Leulseged',
      "ownerEmail" TEXT NOT NULL DEFAULT 'joni@sappyshop.site',
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    ALTER TABLE "AppSettings" ADD COLUMN IF NOT EXISTS "lowStock" INTEGER NOT NULL DEFAULT 5;
    ALTER TABLE "AppSettings" ADD COLUMN IF NOT EXISTS "businessName" TEXT NOT NULL DEFAULT 'Sappy Stationary';
    ALTER TABLE "AppSettings" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'ETB';
    ALTER TABLE "AppSettings" ADD COLUMN IF NOT EXISTS "ownerName" TEXT NOT NULL DEFAULT 'Yohannes Leulseged';
    ALTER TABLE "AppSettings" ADD COLUMN IF NOT EXISTS "ownerEmail" TEXT NOT NULL DEFAULT 'joni@sappyshop.site';
  `;
  const statements = sql.split(";").map(s => s.trim()).filter(Boolean);
  for (const s of statements) {
    try {
      await db.$executeRawUnsafe(s);
    } catch (e) {
      // table/column may already exist — safe to ignore
    }
  }
  await seed(db);
}

async function seed(db: PrismaClient) {
  try {
    const settings = await db.appSettings.findUnique({ where: { id: "singleton" } });
    if (!settings) {
      const masterHash = await bcrypt.hash("Sappy@1313", 10);
      await db.appSettings.create({
        data: {
          id: "singleton",
          masterHash,
          lowStock: 5,
          businessName: "Sappy Stationary",
          currency: "ETB",
          ownerName: "Yohannes Leulseged",
          ownerEmail: "joni@sappyshop.site",
        },
      });
    }
    const owner = await db.user.findUnique({ where: { email: "joni@sappyshop.site" } });
    if (!owner) {
      const hash = await bcrypt.hash("0099484830", 10);
      await db.user.create({
        data: {
          email: "joni@sappyshop.site",
          name: "Yohannes Leulseged",
          passwordHash: hash,
          role: "owner",
        },
      });
    }
  } catch (e) {
    // seeding is best-effort
  }
}