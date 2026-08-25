import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json([]);
  const uid = (session.user as any).id;
  const sessions = await prisma.deviceSession.findMany({ where: { userId: uid }, orderBy: { lastActive: "desc" } });
  return NextResponse.json(sessions);
}