import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });
  const body = await req.json();
  const sale = await prisma.sale.update({
    where: { id: params.id },
    data: { refunded: !!body.refunded },
    include: { lines: true },
  });
  // Restore stock if refunding
  if (body.refunded) {
    for (const l of sale.lines) {
      if (l.itemId) {
        await prisma.inventoryItem.update({
          where: { id: l.itemId },
          data: { quantity: { increment: l.qty } },
        });
      }
    }
  }
  await prisma.activity.create({ data: { action: body.refunded ? "sale_refunded" : "sale_updated", details: sale.invoiceNo, userId: (session.user as any).id } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });
  const sale = await prisma.sale.delete({ where: { id: params.id }, include: { lines: true } });
  await prisma.activity.create({ data: { action: "sale_deleted", details: sale.invoiceNo, userId: (session.user as any).id } });
  return NextResponse.json({ ok: true });
}