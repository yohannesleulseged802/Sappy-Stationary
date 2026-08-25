import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });
  const body = await req.json();
  const po = await prisma.purchaseOrder.findUnique({ where: { id: params.id }, include: { lines: true } });
  if (!po) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (body.status === "received" && po.status !== "received") {
    const uid = (session.user as any).id;
    for (const l of po.lines) {
      if (l.itemId) {
        await prisma.inventoryItem.update({
          where: { id: l.itemId },
          data: { quantity: { increment: l.qty }, cost: l.cost },
        });
      } else {
        // Create new inventory item
        const { genSerial } = await import("@/lib/utils");
        await prisma.inventoryItem.create({
          data: {
            serial: genSerial(),
            name: l.itemName,
            category: "Custom",
            quantity: l.qty,
            cost: l.cost,
            price: l.cost,
            userId: uid,
          },
        });
      }
    }
    await prisma.activity.create({ data: { action: "po_received", details: po.poNumber, userId: uid } });
  }

  await prisma.purchaseOrder.update({ where: { id: params.id }, data: { status: body.status } });
  return NextResponse.json({ ok: true });
}