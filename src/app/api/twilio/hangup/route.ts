/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/twilio/hangup/route.ts

import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// 1. Initialize Twilio client (same as your dial route)
if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
  throw new Error("Twilio credentials missing in hangup route");
}
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

export async function POST(req: NextRequest) {
  try {
    // 2. Authenticate the user
    const headersList = await headers();
    const requestHeaders = new Headers(headersList);

    const session = await auth.api.getSession({
      headers: requestHeaders,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. Get the CallSid from the request
    const { callSid } = await req.json();

    if (!callSid) {
      return NextResponse.json({ error: "Missing 'callSid'" }, { status: 400 });
    }

    // 4. Tell Twilio to hang up the call
    // We update the status to 'completed' to terminate the call.
    console.log(`📞 Attempting to hang up call: ${callSid}`);
    await client.calls(callSid).update({
      status: "completed",
    });

    console.log(`✅ Call hung up: ${callSid}`);

    // 5. Send success response
    // Note: We don't update our database here. Twilio will send a
    // 'completed' event to our 'status-callback' route,
    // which will handle the database update. This is more robust.
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("❌ Error hanging up call:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
