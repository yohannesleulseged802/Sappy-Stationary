import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { qrDataUrl } from "@/lib/qr";
import { toExcelBuffer } from "@/lib/excel";
import { brandedPdf, addTable } from "@/lib/pdf";
import { fmt } from "@/lib/money";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });

  if (req.url.includes("qr=1")) {
    const item = await prisma.inventoryItem.findUnique({ where: { id: params.id } });
    if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
    const dataUrl = await qrDataUrl(item.serial);
    return NextResponse.json({ dataUrl });
  }

  if (req.url.includes("export=xlsx")) {
    const items = await prisma.inventoryItem.findMany({ include: { user: { select: { name: true } } } });
    const rows = items.map(i => ({
      Serial: i.serial, Name: i.name, Category: i.category, Quantity: i.quantity,
      Location: i.location || "", Cost: i.costUnknown ? "" : i.cost?.toString(), Price: i.price.toString(), By: i.user.name,
    }));
    const buf = toExcelBuffer(rows, "Inventory");
    return new NextResponse(buf as any, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" } });
  }

  if (req.url.includes("export=pdf")) {
    const items = await prisma.inventoryItem.findMany({ include: { user: { select: { name: true } } } });
    const doc = brandedPdf("Inventory");
    addTable(doc, [["Serial","Name","Category","Qty","Cost","Price","By"]],
      items.map(i => [i.serial, i.name, i.category, i.quantity.toString(), i.costUnknown ? "—" : fmt(i.cost), fmt(i.price), i.user.name]));
    return new NextResponse(doc.output("arraybuffer"), { headers: { "Content-Type": "application/pdf" } });
  }

  return NextResponse.json({ error: "bad request" }, { status: 400 });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });
  const item = await prisma.inventoryItem.delete({ where: { id: params.id } });
  await prisma.activity.create({ data: { action: "item_deleted", details: item.name, userId: (session.user as any).id } });
  return NextResponse.json({ ok: true });
}