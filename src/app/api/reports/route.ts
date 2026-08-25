import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { num, fmt } from "@/lib/money";
import { brandedPdf, addTable } from "@/lib/pdf";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({});
  const url = new URL(req.url);
  const view = url.searchParams.get("view") || "dashboard";
  const range = url.searchParams.get("range") || "week";
  const pdf = url.searchParams.get("pdf") === "1";

  const settings = await prisma.appSettings.findUnique({ where: { id: "singleton" } }).catch(() => null);
  const lowStock = settings?.lowStock || 5;

  if (view === "dashboard") {
    const items = await prisma.inventoryItem.findMany({ include: { user: { select: { name: true } } } });
    const activity = await prisma.activity.findMany({ include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 20 });
    return NextResponse.json({
      items: items.length,
      units: items.reduce((s, i) => s + i.quantity, 0),
      stockValue: items.reduce((s, i) => s + (i.costUnknown ? 0 : num(i.cost) * i.quantity), 0),
      unknownCost: items.filter(i => i.costUnknown).length,
      lowStock: items.filter(i => i.quantity <= lowStock).map(i => ({ ...i, userName: i.user.name })),
      activity: activity.map(a => ({ ...a, userName: a.user.name })),
    });
  }

  function rangeStart() {
    const d = new Date(); d.setHours(0,0,0,0);
    if (range === "day") return d;
    if (range === "week") { d.setDate(d.getDate() - 7); return d; }
    d.setMonth(d.getMonth() - 12); return d;
  }

  if (view === "Sales") {
    const start = rangeStart();
    const sales = await prisma.sale.findMany({
      where: { date: { gte: start }, refunded: false },
      include: { user: { select: { name: true } } },
      orderBy: { date: "desc" },
    });
    const total = sales.reduce((s, x) => s + num(x.total), 0);
    if (pdf) {
      const doc = brandedPdf("Sales Report");
      addTable(doc, [["Invoice","Date","Payment","Total","By"]],
        sales.map(s => [s.invoiceNo, s.date.toISOString().slice(0,10), s.paymentMethod, fmt(s.total), s.user.name]));
      return new NextResponse(doc.output("arraybuffer"), { headers: { "Content-Type": "application/pdf" } });
    }
    return NextResponse.json({ total, count: sales.length, rows: sales.map(s => ({ ...s, userName: s.user.name })) });
  }

  if (view === "Inventory value") {
    const items = await prisma.inventoryItem.findMany();
    const rows = items.map(i => ({
      id: i.id, name: i.name, category: i.category, quantity: i.quantity,
      costValue: i.costUnknown ? 0 : num(i.cost) * i.quantity,
      sellValue: num(i.price) * i.quantity,
    }));
    const costValue = rows.reduce((s, r) => s + r.costValue, 0);
    const sellValue = rows.reduce((s, r) => s + r.sellValue, 0);
    if (pdf) {
      const doc = brandedPdf("Inventory Valuation");
      addTable(doc, [["Name","Category","Qty","Cost value","Sell value"]],
        rows.map(r => [r.name, r.category, r.quantity.toString(), fmt(r.costValue), fmt(r.sellValue)]));
      return new NextResponse(doc.output("arraybuffer"), { headers: { "Content-Type": "application/pdf" } });
    }
    return NextResponse.json({ costValue, sellValue, profit: sellValue - costValue, count: rows.length, rows });
  }

  if (view === "Profit & margin") {
    const sales = await prisma.sale.findMany({ include: { lines: true }, where: { refunded: false } });
    let revenue = 0, cogs = 0;
    const byProduct: Record<string, { rev: number; cost: number }> = {};
    for (const s of sales) {
      for (const l of s.lines) {
        const rev = l.qty * num(l.price);
        const cost = l.qty * num(l.cost);
        revenue += rev; cogs += cost;
        const k = l.itemName;
        byProduct[k] = byProduct[k] || { rev: 0, cost: 0 };
        byProduct[k].rev += rev; byProduct[k].cost += cost;
      }
    }
    const rows = Object.entries(byProduct).map(([name, v]) => ({
      name, revenue: v.rev, cost: v.cost, profit: v.rev - v.cost,
      margin: v.rev ? ((v.rev - v.cost) / v.rev) * 100 : 0,
    }));
    const margin = revenue ? ((revenue - cogs) / revenue) * 100 : 0;
    if (pdf) {
      const doc = brandedPdf("Profit & Margin");
      addTable(doc, [["Product","Revenue","COGS","Profit","Margin %"]],
        rows.map(r => [r.name, fmt(r.revenue), fmt(r.cost), fmt(r.profit), r.margin.toFixed(1)]));
      return new NextResponse(doc.output("arraybuffer"), { headers: { "Content-Type": "application/pdf" } });
    }
    return NextResponse.json({ revenue, cogs, margin, rows });
  }

  if (view === "Stock alerts") {
    const items = await prisma.inventoryItem.findMany();
    const out = items.filter(i => i.quantity === 0);
    const low = items.filter(i => i.quantity > 0 && i.quantity <= lowStock);
    const rows = [...out, ...low];
    if (pdf) {
      const doc = brandedPdf("Stock Alerts");
      addTable(doc, [["Name","Category","Qty","Status"]],
        rows.map(r => [r.name, r.category, r.quantity.toString(), r.quantity === 0 ? "Out" : "Low"]));
      return new NextResponse(doc.output("arraybuffer"), { headers: { "Content-Type": "application/pdf" } });
    }
    return NextResponse.json({ out: out.length, low: low.length, rows });
  }

  if (view === "Purchasing") {
    const pos = await prisma.purchaseOrder.findMany({ orderBy: { date: "desc" } });
    const total = pos.reduce((s, p) => s + num(p.total), 0);
    if (pdf) {
      const doc = brandedPdf("Purchasing");
      addTable(doc, [["PO","Supplier","Status","Total","Date"]],
        pos.map(p => [p.poNumber, p.supplier, p.status, fmt(p.total), p.date.toISOString().slice(0,10)]));
      return new NextResponse(doc.output("arraybuffer"), { headers: { "Content-Type": "application/pdf" } });
    }
    return NextResponse.json({ total, rows: pos });
  }

  return NextResponse.json({});
}