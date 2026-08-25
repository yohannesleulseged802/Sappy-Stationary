import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json([]);
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role })));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });
  const body = await req.json();
  const hash = await bcrypt.hash(body.password, 10);
  try {
    const u = await prisma.user.create({
      data: { email: body.email.toLowerCase(), name: body.name, passwordHash: hash, role: "staff" },
    });
    await prisma.activity.create({ data: { action: "user_created", details: u.email, userId: (session.user as any).id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 400 });
  }
}