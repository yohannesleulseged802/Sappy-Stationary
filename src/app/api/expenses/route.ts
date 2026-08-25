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
    const expenses = await prisma.expense.findMany({ include: { user: { select: { name: true } } }, orderBy: { date: "desc" } });
    const doc = brandedPdf("Expenses");
    addTable(doc, [["Category","Description","Amount","Date","By"]],
      expenses.map(e => [e.category, e.description || "", fmt(e.amount), e.date.toISOString().slice(0,10), e.user.name]));
    return new NextResponse(doc.output("arraybuffer"), { headers: { "Content-Type": "application/pdf" } });
  }

  const expenses = await prisma.expense.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(expenses.map(e => ({ ...e, userName: e.user.name })));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });
  const uid = (session.user as any).id;
  const body = await req.json();
  const date = new Date(body.date);
  const now = new Date(); now.setHours(0,0,0,0);
  const backdated = date < now;
  const e = await prisma.expense.create({
    data: {
      category: body.category,
      description: body.description || null,
      amount: body.amount,
      date,
      backdated,
      userId: uid,
    },
  });
  await prisma.activity.create({ data: { action: "expense_added", details: `${e.category} ${fmt(e.amount)}`, userId: uid } });
  return NextResponse.json({ ok: true });
}