import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json([], { status: 401 });
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(users.map(u => ({
    id: u.id, name: u.name, email: u.email, role: u.role, avatar: u.avatar || "", createdAt: u.createdAt,
  })));
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
  if (!me || me.role !== "owner") return NextResponse.json({ error: "Only the owner can promote or demote users" }, { status: 403 });

  const body = await req.json();
  const role = String(body.role || "");
  if (!["staff", "manager", "owner"].includes(role)) return NextResponse.json({ error: "Unknown role" }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id: body.id } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.id === me.id) return NextResponse.json({ error: "You cannot change your own role" }, { status: 400 });
  if (target.role === "owner" && role !== "owner") {
    const owners = await prisma.user.count({ where: { role: "owner" } });
    if (owners <= 1) return NextResponse.json({ error: "At least one owner is required" }, { status: 400 });
  }

  const u = await prisma.user.update({ where: { id: target.id }, data: { role } });
  await prisma.activity.create({ data: { action: "role_changed", details: `${u.name} → ${role}`, userId: me.id } });
  return NextResponse.json({ ok: true });
}