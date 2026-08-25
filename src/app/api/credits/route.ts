import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { brandedPdf, addTable } from "@/lib/pdf";
import { fmt } from "@/lib/money";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json([]);

  if (req.url.includes("export=pdf")) {
    const credits = await prisma.credit.findMany({ include: { user: { select: { name: true } } }, orderBy: { date: "desc" } });
    const doc = brandedPdf("Credit Book");
    addTable(doc, [["Customer","Item","Amount","Date","Status","By"]],
      credits.map(c => [c.customer, c.item, fmt(c.amount), c.date.toISOString().slice(0,10), c.paid ? "Paid" : "Open", c.user.name]));
    return new NextResponse(doc.output("arraybuffer"), { headers: { "Content-Type": "application/pdf" } });
  }

  const credits = await prisma.credit.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(credits.map(c => ({ ...c, userName: c.user.name })));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });
  const uid = (session.user as any).id;
  const body = await req.json();
  const date = new Date(body.date);
  const now = new Date(); now.setHours(0,0,0,0);
  const backdated = date < now;
  const c = await prisma.credit.create({
    data: { customer: body.customer, item: body.item, amount: body.amount, date, backdated, userId: uid },
  });
  await prisma.activity.create({ data: { action: "credit_added", details: `${c.customer} ${fmt(c.amount)}`, userId: uid } });
  return NextResponse.json({ ok: true });
}