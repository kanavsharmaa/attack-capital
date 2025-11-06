/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { CallStrategy } from "@/generated/prisma/client";
import { emitDialing } from "@/lib/event-bus";

// ... environment variable checks ...

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure

if (
  !process.env.TWILIO_ACCOUNT_SID ||
  !process.env.TWILIO_AUTH_TOKEN ||
  !process.env.TWILIO_PHONE_NUMBER ||
  !process.env.NGROK_URL
) {
  throw new Error("Credentials required. Error in Dial Route");
}

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const ngrokURL = process.env.NGROK_URL;

const client = twilio(accountSid, authToken);

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate the user
    const headersList = await headers();
    const requestHeaders = new Headers(headersList);
    
    const session = await auth.api.getSession({
      headers: requestHeaders,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get request data
    const { to, userId } = await req.json();

    if (!to) {
      return NextResponse.json({ error: "Missing 'to' number" }, { status: 400 });
    }

    // 3. SECURITY: Verify the userId matches the authenticated user
    if (userId && userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden: Cannot make calls for other users" }, { status: 403 });
    }

    // Use the authenticated user's ID (not the one from the request body)
    const authenticatedUserId = session.user.id;

    // 4. Make the Twilio call
    const call = await client.calls.create({
      from: twilioPhoneNumber,
      to,
      url: `${ngrokURL}/api/twilio/initial-twiml`,
      machineDetection: 'Enable',
      statusCallback: `${ngrokURL}/api/twilio/status-callback`,
    });
    
    // 5. Save the call log with the authenticated user's ID
    await prisma.callLog.create({
      data: {
        targetNumber: to,
        strategyUsed: CallStrategy.TWILIO_NATIVE,
        twilioCallSid: call.sid,
        userId: authenticatedUserId, // Use authenticated user's ID
      },
    });

    console.log("✅ Call initiated:", call.sid);

    emitDialing({
      type: "DIALING",
      userId: authenticatedUserId,
      callSid: call.sid,
      to,
    });
  
    return NextResponse.json({ callSid: call.sid }, { status: 200 });
  } catch (err: any) {
    console.error("❌ Error dialing number and saving log:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}