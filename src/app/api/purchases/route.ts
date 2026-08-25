import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { genPO } from "@/lib/utils";
import { num } from "@/lib/money";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json([]);
  const pos = await prisma.purchaseOrder.findMany({
    include: { lines: true, user: { select: { name: true } } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(pos.map(p => ({ ...p, userName: p.user.name })));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });
  const uid = (session.user as any).id;
  const body = await req.json();
  const lines = (body.lines || []).map((l: any) => ({
    id: crypto.randomUUID(),
    itemName: l.itemName,
    qty: Number(l.qty),
    cost: Number(l.cost),
    itemId: l.itemId || null,
  }));
  const total = lines.reduce((s: number, l: any) => s + l.qty * num(l.cost), 0);
  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber: genPO(),
      supplier: body.supplier,
      status: body.status || "draft",
      total,
      date: new Date(body.date),
      userId: uid,
      lines: { create: lines },
    },
  });
  await prisma.activity.create({ data: { action: "po_created", details: po.poNumber, userId: uid } });
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });
  const body = await req.json();
  await prisma.purchaseOrder.update({
    where: { id: body.id },
    data: { supplier: body.supplier, status: body.status, total: body.total, date: new Date(body.date) },
  });
  return NextResponse.json({ ok: true });
}