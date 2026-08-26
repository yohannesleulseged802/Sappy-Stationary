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
  const sort = url.searchParams.get("sort") || "newest";
  const pdf = url.searchParams.get("pdf") === "1";

  const settings = await prisma.appSettings.findUnique({ where: { id: "singleton" } }).catch(() => null);
  const lowThreshold = settings?.lowStock || 5;

  /* ---------------- DASHBOARD ---------------- */
  if (view === "dashboard") {
    const items = await prisma.inventoryItem.findMany({ include: { user: { select: { name: true } } } });
    const activity = await prisma.activity.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json({
      items: items.length,                                                  // unique items
      units: items.reduce((s, i) => s + num(i.quantity), 0),                // total units
      stockValue: items.reduce((s, i) => s + num(i.price) * num(i.quantity), 0), // sell-price sum
      unknownCost: items.filter(i => i.costUnknown || i.cost === null).length,   // no cost provided
      lowStock: items
        .filter(i => i.quantity <= lowThreshold)
        .map(i => ({ ...i, userName: i.user.name })),
      activity: activity.map(a => ({ ...a, userName: a.user.name })),
    });
  }

  function rangeStart() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    if (range === "day") return d;
    if (range === "week") { d.setDate(d.getDate() - 7); return d; }
    if (range === "month") { d.setMonth(d.getMonth() - 1); return d; }
    d.setFullYear(d.getFullYear() - 1);
    return d;
  }

  /* ---------------- SALES ---------------- */
  if (view === "Sales") {
    const start = rangeStart();
    const sales = await prisma.sale.findMany({
      where: { date: { gte: start }, refunded: false },
      include: { lines: true, user: { select: { name: true } } },
    });

    if (sort === "newest") sales.sort((a, b) => +new Date(b.date) - +new Date(a.date));
    if (sort === "oldest") sales.sort((a, b) => +new Date(a.date) - +new Date(b.date));
    if (sort === "highest") sales.sort((a, b) => num(b.total) - num(a.total));
    if (sort === "lowest") sales.sort((a, b) => num(a.total) - num(b.total));
    if (sort === "item") sales.sort((a, b) => a.invoiceNo.localeCompare(b.invoiceNo));

    const total = sales.reduce((s, x) => s + num(x.total), 0);

    if (pdf) {
      const doc = brandedPdf(`Sales Report (${range})`);
      const y = addTable(
        doc,
        [["Invoice", "Date", "Payment", "Items", "Total", "By"]],
        sales.map(s => [s.invoiceNo, s.date.toISOString().slice(0, 10), s.paymentMethod, String(s.lines.length), fmt(s.total), s.user.name])
      );
      doc.setFontSize(11);
      doc.setTextColor(4, 120, 87);
      doc.text(`Total: ${fmt(total)}   •   ${sales.length} sales`, 30, y + 26);
      return new NextResponse(doc.output("arraybuffer"), { headers: { "Content-Type": "application/pdf" } });
    }

    return NextResponse.json({
      total,
      count: sales.length,
      rows: sales.map(s => ({
        id: s.id,
        invoiceNo: s.invoiceNo,
        date: s.date,
        paymentMethod: s.paymentMethod,
        total: s.total,
        backdated: s.backdated,
        userName: s.user.name,
        linesCount: s.lines.length,
      })),
    });
  }

  /* ---------------- INVENTORY VALUE ---------------- */
  if (view === "Inventory value") {
    const items = await prisma.inventoryItem.findMany();
    const rows = items.map(i => ({
      id: i.id,
      name: i.name,
      category: i.category,
      quantity: i.quantity,
      costValue: i.costUnknown || i.cost === null ? 0 : num(i.cost) * num(i.quantity),
      sellValue: num(i.price) * num(i.quantity),
    }));
    const costValue = rows.reduce((s, r) => s + r.costValue, 0);
    const sellValue = rows.reduce((s, r) => s + r.sellValue, 0);

    const byCat: Record<string, { cost: number; sell: number; units: number }> = {};
    rows.forEach(r => {
      byCat[r.category] = byCat[r.category] || { cost: 0, sell: 0, units: 0 };
      byCat[r.category].cost += r.costValue;
      byCat[r.category].sell += r.sellValue;
      byCat[r.category].units += r.quantity;
    });
    const categories = Object.entries(byCat)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.sell - a.sell);

    if (pdf) {
      const doc = brandedPdf("Inventory Valuation");
      const y1 = addTable(
        doc,
        [["Category", "Units", "Cost value", "Sell value", "Potential profit"]],
        categories.map(c => [c.name, String(c.units), fmt(c.cost), fmt(c.sell), fmt(c.sell - c.cost)]),
        90
      );
      addTable(
        doc,
        [["Name", "Category", "Qty", "Cost value", "Sell value"]],
        rows.map(r => [r.name, r.category, String(r.quantity), fmt(r.costValue), fmt(r.sellValue)]),
        y1 + 40
      );
      return new NextResponse(doc.output("arraybuffer"), { headers: { "Content-Type": "application/pdf" } });
    }

    return NextResponse.json({ costValue, sellValue, profit: sellValue - costValue, count: rows.length, rows, categories });
  }

  /* ---------------- PROFIT & MARGIN ---------------- */
  if (view === "Profit & margin") {
    const sales = await prisma.sale.findMany({ include: { lines: true }, where: { refunded: false } });
    let revenue = 0, cogs = 0;
    const byProduct: Record<string, { rev: number; cost: number }> = {};
    for (const s of sales) {
      for (const l of s.lines) {
        const rev = l.qty * num(l.price);
        const cost = l.qty * num(l.cost);
        revenue += rev;
        cogs += cost;
        byProduct[l.itemName] = byProduct[l.itemName] || { rev: 0, cost: 0 };
        byProduct[l.itemName].rev += rev;
        byProduct[l.itemName].cost += cost;
      }
    }
    const rows = Object.entries(byProduct)
      .map(([name, v]) => ({
        name,
        revenue: v.rev,
        cost: v.cost,
        profit: v.rev - v.cost,
        margin: v.rev ? ((v.rev - v.cost) / v.rev) * 100 : 0,
      }))
      .sort((a, b) => b.profit - a.profit);
    const margin = revenue ? ((revenue - cogs) / revenue) * 100 : 0;

    if (pdf) {
      const doc = brandedPdf("Profit & Margin");
      const y = addTable(
        doc,
        [["Product", "Revenue", "COGS", "Profit", "Margin %"]],
        rows.map(r => [r.name, fmt(r.revenue), fmt(r.cost), fmt(r.profit), r.margin.toFixed(1)])
      );
      doc.setFontSize(11);
      doc.setTextColor(4, 120, 87);
      doc.text(`Revenue: ${fmt(revenue)}   •   COGS: ${fmt(cogs)}   •   Margin: ${margin.toFixed(1)}%`, 30, y + 26);
      return new NextResponse(doc.output("arraybuffer"), { headers: { "Content-Type": "application/pdf" } });
    }

    return NextResponse.json({ revenue, cogs, margin, rows });
  }

  /* ---------------- STOCK ALERTS ---------------- */
  if (view === "Stock alerts") {
    const items = await prisma.inventoryItem.findMany();
    const out = items.filter(i => i.quantity === 0);
    const low = items.filter(i => i.quantity > 0 && i.quantity <= lowThreshold);
    const rows = [...out, ...low].map(i => ({
      id: i.id,
      name: i.name,
      category: i.category,
      quantity: i.quantity,
      reorder: Math.max(lowThreshold * 2 - i.quantity, lowThreshold),
    }));

    if (pdf) {
      const doc = brandedPdf("Stock Alerts & Reorder List");
      addTable(
        doc,
        [["Name", "Category", "Qty", "Status", "Suggested reorder"]],
        rows.map(r => [r.name, r.category, String(r.quantity), r.quantity === 0 ? "OUT" : "LOW", String(r.reorder)])
      );
      return new NextResponse(doc.output("arraybuffer"), { headers: { "Content-Type": "application/pdf" } });
    }

    return NextResponse.json({ out: out.length, low: low.length, rows });
  }

  /* ---------------- PURCHASING ---------------- */
  if (view === "Purchasing") {
    const pos = await prisma.purchaseOrder.findMany({ orderBy: { date: "desc" } });
    const total = pos.reduce((s, p) => s + num(p.total), 0);

    const bySup: Record<string, number> = {};
    pos.forEach(p => { bySup[p.supplier] = (bySup[p.supplier] || 0) + num(p.total); });
    const suppliers = Object.entries(bySup)
      .map(([name, spend]) => ({ name, spend }))
      .sort((a, b) => b.spend - a.spend);

    if (pdf) {
      const doc = brandedPdf("Purchasing Report");
      const y1 = addTable(
        doc,
        [["Supplier", "Total spend"]],
        suppliers.map(s => [s.name, fmt(s.spend)]),
        90
      );
      addTable(
        doc,
        [["PO", "Supplier", "Status", "Total", "Date"]],
        pos.map(p => [p.poNumber, p.supplier, p.status, fmt(p.total), p.date.toISOString().slice(0, 10)]),
        y1 + 40
      );
      return new NextResponse(doc.output("arraybuffer"), { headers: { "Content-Type": "application/pdf" } });
    }

    return NextResponse.json({ total, rows: pos, suppliers });
  }

  return NextResponse.json({});
}