import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });
  const body = await req.json();
  const settings = await prisma.appSettings.findUnique({ where: { id: "singleton" } });
  if (!settings) return NextResponse.json({ error: "no settings" }, { status: 500 });
  const ok = await bcrypt.compare(body.masterCode || "", settings.masterHash);
  return NextResponse.json({ ok });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });
  const body = await req.body ? await req.json() : {};
  const settings = await prisma.appSettings.findUnique({ where: { id: "singleton" } });
  if (!settings) return NextResponse.json({ error: "no settings" }, { status: 500 });
  const ok = await bcrypt.compare(body.currentMaster || "", settings.masterHash);
  if (!ok) return NextResponse.json({ error: "wrong" }, { status: 400 });
  const newHash = await bcrypt.hash(body.newMaster, 10);
  await prisma.appSettings.update({ where: { id: "singleton" }, data: { masterHash: newHash } });
  return NextResponse.json({ ok: true });
}