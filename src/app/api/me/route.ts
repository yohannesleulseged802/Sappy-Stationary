import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });
  const u = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
  if (!u) return NextResponse.json({ error: "missing" }, { status: 404 });
  return NextResponse.json({ id: u.id, name: u.name, email: u.email, role: u.role, avatar: u.avatar || "" });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const data: any = {};
  if (typeof body.avatar === "string") {
    if (body.avatar.length > 300000) return NextResponse.json({ error: "Photo too big — pick a smaller image" }, { status: 400 });
    if (body.avatar && !body.avatar.startsWith("data:image")) return NextResponse.json({ error: "Bad image" }, { status: 400 });
    data.avatar = body.avatar || null;
  }
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim().slice(0, 60);
  const u = await prisma.user.update({ where: { id: (session.user as any).id }, data });
  return NextResponse.json({ ok: true, user: { id: u.id, name: u.name, email: u.email, role: u.role, avatar: u.avatar || "" } });
}