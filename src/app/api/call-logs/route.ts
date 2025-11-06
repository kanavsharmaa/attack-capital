import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // FIX: Await the headers() call and then convert to a new Headers object
    const headersList = await headers();
    const requestHeaders = new Headers(headersList);

    // Get the session using the correct API method
    const session = await auth.api.getSession({
      headers: requestHeaders,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch all call logs for the authenticated user
    const callLogs = await prisma.callLog.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(callLogs, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching call logs:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
