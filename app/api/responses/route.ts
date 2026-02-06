import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const payloadSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
  askedBy: z.string().trim().min(2).max(120),
  questionKey: z.string().trim().min(1).max(80),
  questionText: z.string().trim().min(1).max(300),
  answer: z.enum(["YES", "NO"]),
  selfieData: z.string().max(2_500_000).optional(),
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

    const normalizedEmail = parsed.data.email.toLowerCase();
    const normalizedName = parsed.data.name;
    const normalizedAskedBy = parsed.data.askedBy.trim();
    const selfieData = parsed.data.selfieData ?? null;

    await prisma.respondent.upsert({
      where: {
        email_name: {
          email: normalizedEmail,
          name: normalizedName,
        },
      },
      create: {
        email: normalizedEmail,
        name: normalizedName,
        askedBy: normalizedAskedBy,
        selfieData,
      },
      update: {
        askedBy: normalizedAskedBy,
        selfieData: selfieData ?? undefined,
      },
    });

    const created = await prisma.interactionResponse.create({
      data: {
        answer: parsed.data.answer,
        questionKey: parsed.data.questionKey,
        questionText: parsed.data.questionText,
        askedBy: normalizedAskedBy,
        selfieData,
        respondentEmail: normalizedEmail,
        respondentName: normalizedName,
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
    const [yesCount, noCount, total, recent] = await Promise.all([
      prisma.interactionResponse.count({ where: { answer: "YES" } }),
      prisma.interactionResponse.count({ where: { answer: "NO" } }),
      prisma.interactionResponse.count(),
      prisma.interactionResponse.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          answer: true,
          questionKey: true,
          questionText: true,
          askedBy: true,
          createdAt: true,
          respondentEmail: true,
          respondentName: true,
        },
      }),
    ]);

    return NextResponse.json({ total, yesCount, noCount, recent });
  } catch (error) {
    console.error("Failed to fetch stats", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
