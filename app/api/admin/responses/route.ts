import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-session";

type DeletePayload = {
  email: string;
  name: string;
};

export async function GET() {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [totalSubmissions, respondents] = await Promise.all([
      prisma.interactionResponse.count(),
      prisma.respondent.findMany({
        orderBy: { updatedAt: "desc" },
        select: {
          email: true,
          name: true,
          askedBy: true,
          selfieData: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { responses: true } },
        },
      }),
    ]);

    return NextResponse.json({
      totalRespondents: respondents.length,
      totalSubmissions,
      respondents,
    });
  } catch (error) {
    console.error("Failed to load admin responses", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as Partial<DeletePayload>;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!email || !name) {
      return NextResponse.json({ error: "Missing respondent identity." }, { status: 400 });
    }

    // Cascade deletes InteractionResponse via relation on Respondent.
    await prisma.respondent.delete({
      where: { email_name: { email, name } },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete respondent", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
