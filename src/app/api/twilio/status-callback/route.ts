import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Import the Prisma client instance
import { CallStatus } from "@/generated/prisma/client";
import { emitUpdate } from "@/lib/event-bus";

export async function POST(req: NextRequest) {
  try {
    // Twilio sends webhook data as x-www-form-urlencoded, not JSON
    const formData = await req.formData();
    const data = Object.fromEntries(formData) as Record<string, string>;

    const callSid = data.CallSid;
    const twilioCallStatus = data.CallStatus;

    if (!callSid || !twilioCallStatus) {
      console.error("Missing CallSid or CallStatus in Twilio callback.");
      return new Response(null, { status: 400 });
    }

    console.log("📞 Twilio Status Callback Received:");
    console.log({
      CallSid: callSid,
      CallStatus: twilioCallStatus,
      Timestamp: new Date().toISOString(),
    });

    // We check for terminal failure/non-answer states that occur *before* the AMD
    // 'initial-twiml' handles successful connections or machine detection.
    let newStatus: CallStatus | undefined;
    
    switch (twilioCallStatus) {
      case 'no-answer':
      case 'busy':
      case 'canceled':
        newStatus = CallStatus.NO_ANSWER; //
        break;
      case 'failed':
      case 'undelivered':
        newStatus = CallStatus.ERROR; //
        break;
      default:
        // Ignore statuses like 'ringing', 'in-progress', 'completed' (which are often
        // a result of the TwiML in initial-twiml), or other intermediate statuses.
        return new Response(null, { status: 204 });
    }
    
    // Update the CallLog in the database
    if (newStatus) {
      const log = await prisma.callLog.update({
        where: {
          twilioCallSid: callSid,
        },
        data: {
          status: newStatus,
        },
      });

      emitUpdate({
        type: "UPDATE",
        userId: log.userId,
        callSid,
        status: newStatus, // "NO_ANSWER" | "ERROR"
      });
    }

    // Twilio requires a 200 or 204 response
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("❌ Error in status-callback route:", err);
    // Always return 204 to Twilio to prevent retries
    return new Response(null, { status: 204 });
  }
}