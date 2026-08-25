import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { genSerial } from "@/lib/utils";
import { readExcel, toExcelBuffer } from "@/lib/excel";
import { brandedPdf, addTable } from "@/lib/pdf";
import { fmt } from "@/lib/money";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json([], { status: 401 });

  if (req.url.includes("export=xlsx")) {
    const items = await prisma.inventoryItem.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    const rows = items.map(i => ({
      Serial: i.serial,
      Name: i.name,
      Category: i.category,
      Quantity: i.quantity,
      Location: i.location || "",
      Cost: i.costUnknown ? "" : (i.cost?.toString() || ""),
      Price: i.price.toString(),
      By: i.user.name,
    }));
    const buf = toExcelBuffer(rows, "Inventory");
    return new NextResponse(buf as any, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="inventory.xlsx"',
      },
    });
  }

  if (req.url.includes("export=pdf")) {
    const items = await prisma.inventoryItem.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    const doc = brandedPdf("Inventory");
    addTable(
      doc,
      [["Serial", "Name", "Category", "Qty", "Cost", "Price", "By"]],
      items.map(i => [i.serial, i.name, i.category, String(i.quantity), i.costUnknown ? "unknown" : fmt(i.cost), fmt(i.price), i.user.name])
    );
    return new NextResponse(doc.output("arraybuffer"), { headers: { "Content-Type": "application/pdf" } });
  }

  const items = await prisma.inventoryItem.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(items.map(i => ({ ...i, userName: i.user.name })));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });
  const uid = (session.user as any).id;

  if (req.url.includes("import=1")) {
    const fd = await req.formData();
    const f = fd.get("file") as File;
    const buf = Buffer.from(await f.arrayBuffer());
    const { rows } = readExcel(buf);
    let count = 0;
    for (const r of rows) {
      const name = String(r.name || r.Name || r.item || "").trim();
      if (!name) continue;
      await prisma.inventoryItem.create({
        data: {
          serial: genSerial(),
          name,
          category: String(r.category || r.Category || "Custom"),
          quantity: Number(r.quantity || r.Quantity || r.qty || 0),
          location: String(r.location || r.Location || ""),
          cost: r.cost || r.Cost ? Number(r.cost || r.Cost) : null,
          price: Number(r.price || r.Price || r.sell || 0),
          costUnknown: !r.cost && !r.Cost,
          userId: uid,
        },
      });
      count++;
    }
    await prisma.activity.create({ data: { action: "inventory_imported", details: `${count} items`, userId: uid } });
    return NextResponse.json({ ok: true, count });
  }

  const body = await req.json();
  const item = await prisma.inventoryItem.create({
    data: {
      serial: genSerial(),
      name: body.name,
      category: body.category,
      quantity: Number(body.quantity || 0),
      location: body.location || null,
      cost: body.costUnknown ? null : (body.cost ?? null),
      price: Number(body.price || 0),
      costUnknown: !!body.costUnknown,
      userId: uid,
    },
  });
  await prisma.activity.create({ data: { action: "item_created", details: item.name, userId: uid } });
  return NextResponse.json({ ok: true, item });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });
  const body = await req.json();
  await prisma.inventoryItem.update({
    where: { id: body.id },
    data: {
      name: body.name,
      category: body.category,
      quantity: Number(body.quantity || 0),
      location: body.location || null,
      cost: body.costUnknown ? null : (body.cost ?? null),
      price: Number(body.price || 0),
      costUnknown: !!body.costUnknown,
    },
  });
  await prisma.activity.create({ data: { action: "item_updated", details: body.name, userId: (session.user as any).id } });
  return NextResponse.json({ ok: true });
}