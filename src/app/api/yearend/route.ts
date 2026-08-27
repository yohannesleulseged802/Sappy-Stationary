import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });
  if ((session.user as any).role !== "owner")
    return NextResponse.json({ error: "Owner only" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const settings = await prisma.appSettings.findUnique({ where: { id: "singleton" } });
  if (!settings) return NextResponse.json({ error: "Settings missing" }, { status: 500 });
  const ok = await bcrypt.compare(body.masterCode || "", settings.masterHash);
  if (!ok) return NextResponse.json({ error: "Incorrect master code" }, { status: 403 });

  const sales = await prisma.sale.findMany({ select: { id: true } });
  const saleIds = sales.map(s => s.id);

  await prisma.$transaction([
    prisma.saleLine.deleteMany({ where: { saleId: { in: saleIds } } }),
    prisma.sale.deleteMany({}),
    prisma.expense.deleteMany({}),
    prisma.purchaseLine.deleteMany({}),
    prisma.purchaseOrder.deleteMany({}),
    prisma.credit.deleteMany({ where: { paid: true } }), // keep OPEN credits
    prisma.activity.deleteMany({}),
  ]);
  // KEPT: inventory, open credits, users, settings, device sessions

  return NextResponse.json({ ok: true });
}