import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const payloadSchema = z.object({
  answer: z.enum(["YES", "NO"]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = payloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      null;
    const userAgent = request.headers.get("user-agent");

    const created = await prisma.cardResponse.create({
      data: {
        answer: parsed.data.answer,
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({ id: created.id, answer: created.answer }, { status: 201 });
  } catch (error) {
    console.error("Failed to store response", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const [yesCount, noCount, total] = await Promise.all([
      prisma.cardResponse.count({ where: { answer: "YES" } }),
      prisma.cardResponse.count({ where: { answer: "NO" } }),
      prisma.cardResponse.count(),
    ]);

    return NextResponse.json({ total, yesCount, noCount });
  } catch (error) {
    console.error("Failed to fetch stats", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
