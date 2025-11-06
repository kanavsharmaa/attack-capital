// api/twilio/initial-twiml/route.ts
import { NextRequest } from "next/server";
import { twiml } from "twilio";
import prisma from "@/lib/prisma";
import { CallStatus } from "@/generated/prisma/client";
import { emitUpdate } from "@/lib/event-bus";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const answeredBy = formData.get("AnsweredBy"); // 'human', 'machine', or null/undefined if detection timed out or failed
  const callSid = formData.get("CallSid") as string; // Twilio always provides CallSid

  console.log(`INITIAL-TWIML (Sync): AMD status is: ${answeredBy}`);

  const response = new twiml.VoiceResponse();

  let newStatus: CallStatus | undefined;

  if (answeredBy === "human") {
    newStatus = CallStatus.HUMAN; //
    // AMD is complete. The human is waiting.
    response.say("Hello, a human has answered. Connecting you.");
  } else if (answeredBy === "machine_start") {
    newStatus = CallStatus.MACHINE; //
    console.log("Machine answered. Hanging up.");
    response.hangup();
  } else {
    // This includes 'fax', 'sip', 'unknown', null/undefined (timeout/failure)
    // We'll treat unexpected or failed AMD as a non-human answer and hang up.
    newStatus = CallStatus.NO_ANSWER; //
    console.log(`AMD failed, timed out, or not human/machine. Hanging up. AMD status: ${answeredBy}`);
    response.hangup();
  }

  console.log("AMD Status: ", answeredBy);
  console.log("new Status: ", newStatus);
  // Save the AMD status to the database
  if (callSid && newStatus) {
    try {
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
        status: newStatus, // "HUMAN" | "MACHINE" | "NO_ANSWER"
      });

    } catch (dbError) {
      console.error("❌ Error updating call log in initial-twiml:", dbError);
      // Continue with Twiml response even if DB update fails
    }
  }

  return new Response(response.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}