import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });
  const body = await req.json();
  await prisma.credit.update({ where: { id: params.id }, data: { paid: !!body.paid } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });
  await prisma.credit.delete({ where: { id: params.id } });
  await prisma.activity.create({ data: { action: "credit_deleted", details: params.id, userId: (session.user as any).id } });
  return NextResponse.json({ ok: true });
}