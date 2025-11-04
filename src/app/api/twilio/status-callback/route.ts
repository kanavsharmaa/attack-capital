import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Twilio sends webhook data as x-www-form-urlencoded, not JSON
    const formData = await req.formData();
    const data = Object.fromEntries(formData);

    console.log("📞 Twilio Status Callback Received:");
    console.log({
      CallSid: data.CallSid,
      CallStatus: data.CallStatus,
      // From: data.From,
      // To: data.To,
      // Direction: data.Direction,
      Timestamp: new Date().toISOString(),
    });

    // You can optionally save this to your DB using Prisma here
    // await prisma.callLogs.create({ data });

    // Twilio requires a 200 or 204 response
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("❌ Error in status-callback route:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
