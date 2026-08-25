import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { genInvoice } from "@/lib/utils";
import { num } from "@/lib/money";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json([]);
  const sales = await prisma.sale.findMany({
    include: { lines: true, user: { select: { name: true } } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(sales.map(s => ({ ...s, userName: s.user.name })));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });
  const uid = (session.user as any).id;
  const body = await req.json();

  const date = new Date(body.date);
  const now = new Date(); now.setHours(0,0,0,0);
  const backdated = date < now;

  const lines = (body.lines || []).map((l: any) => ({
    id: crypto.randomUUID(),
    itemId: l.itemId || null,
    itemName: l.name,
    qty: Number(l.qty),
    price: Number(l.price),
    cost: null,
  }));

  // Resolve cost from inventory if itemId present
  for (const l of lines) {
    if (l.itemId) {
      const it = await prisma.inventoryItem.findUnique({ where: { id: l.itemId } });
      if (it) l.cost = it.costUnknown ? null : (it.cost as any);
    }
  }

  const subtotal = lines.reduce((s: number, l: any) => s + l.qty * num(l.price), 0);
  const discount = Number(body.discount || 0);
  const total = Math.max(0, subtotal - discount);

  const sale = await prisma.sale.create({
    data: {
      invoiceNo: genInvoice(),
      date,
      backdated,
      paymentMethod: body.paymentMethod,
      total,
      discount,
      userId: uid,
      lines: { create: lines },
    },
  });

  // Decrement stock
  for (const l of lines) {
    if (l.itemId) {
      await prisma.inventoryItem.update({
        where: { id: l.itemId },
        data: { quantity: { decrement: l.qty } },
      });
    }
  }

  await prisma.activity.create({ data: { action: "sale_recorded", details: `${sale.invoiceNo} ${fmt(total)}`, userId: uid } });
  return NextResponse.json({ ok: true, sale });
}

import { fmt } from "@/lib/money";