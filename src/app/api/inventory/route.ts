import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { genSerial } from "@/lib/utils";
import { readExcel, toExcelBuffer } from "@/lib/excel";
import { brandedPdf, addTable } from "@/lib/pdf";
import { fmt } from "@/lib/money";

function toNum(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? null : n;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json([], { status: 401 });

  if (req.url.includes("export=template")) {
    const rows = [
      { Name: "Example Notebook", Category: "Custom", Quantity: 10, Location: "Shelf A", Cost: 25, Price: 60 },
      { Name: "Ballpoint Pen", Category: "Custom", Quantity: 50, Location: "Shelf B", Cost: "", Price: 10 },
    ];
    const buf = toExcelBuffer(rows, "Template");
    return new NextResponse(buf as any, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="sappy-import-template.xlsx"',
      },
    });
  }

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
      [["Serial", "Name", "Category", "Qty", "Cost", "Price"]],
      items.map(i => [i.serial, i.name, i.category, String(i.quantity), i.costUnknown ? "unknown" : fmt(i.cost), fmt(i.price)])
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
    let added = 0, updated = 0;
    const errors: string[] = [];

    const pick = (norm: Record<string, any>, keys: string[]) => {
      for (const k of keys) if (norm[k] !== undefined && norm[k] !== "") return norm[k];
      return undefined;
    };

    for (let idx = 0; idx < rows.length; idx++) {
      const r = rows[idx];
      const norm: Record<string, any> = {};
      Object.keys(r).forEach(k => {
        norm[k.toLowerCase().replace(/[^a-z0-9]/g, "")] = r[k];
      });

      const name = String(
        pick(norm, ["name", "item", "itemname", "product", "productname", "title", "description"]) || ""
      ).trim();
      if (!name) { errors.push(`Row ${idx + 2}: missing Name`); continue; }

      const category = String(pick(norm, ["category", "cat", "type", "group"]) || "Custom");
      const quantity = toNum(pick(norm, ["quantity", "qty", "stock", "units", "count"])) ?? 0;
      const location = String(pick(norm, ["location", "loc", "shelf", "place"]) || "");
      const cost = toNum(pick(norm, ["cost", "costprice", "purchaseprice", "buyprice", "unitcost", "costetb", "purchase"]));
      const price = toNum(pick(norm, ["price", "sellprice", "sellingprice", "saleprice", "salesprice", "unitprice", "sell", "selling", "sales", "priceetb"])) ?? 0;

      try {
        const existing = await prisma.inventoryItem.findFirst({
          where: { name: { equals: name, mode: "insensitive" } },
        });
        if (existing) {
          await prisma.inventoryItem.update({
            where: { id: existing.id },
            data: {
              category,
              quantity,
              location: location || existing.location,
              cost: cost === null ? existing.cost : cost,
              price: price || existing.price,
              costUnknown: cost === null ? existing.costUnknown : false,
            },
          });
          updated++;
        } else {
          await prisma.inventoryItem.create({
            data: {
              serial: genSerial(),
              name, category, quantity,
              location: location || null,
              cost, price,
              costUnknown: cost === null,
              userId: uid,
            },
          });
          added++;
        }
      } catch (e: any) {
        errors.push(`Row ${idx + 2}: ${e.message}`);
      }
    }

    await prisma.activity.create({
      data: { action: "inventory_imported", details: `${added} added, ${updated} updated`, userId: uid },
    });
    return NextResponse.json({ ok: true, count: added, updated, errors });
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