import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureSchema } from "@/lib/schema-heal";

export async function POST(req: NextRequest) {
  try {
    await ensureSchema(prisma);
    if (req.url.includes("reset=1")) {
      await prisma.saleLine.deleteMany();
      await prisma.sale.deleteMany();
      await prisma.credit.deleteMany();
      await prisma.purchaseLine.deleteMany();
      await prisma.purchaseOrder.deleteMany();
      await prisma.expense.deleteMany();
      await prisma.inventoryItem.deleteMany();
      await prisma.activity.deleteMany();
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}