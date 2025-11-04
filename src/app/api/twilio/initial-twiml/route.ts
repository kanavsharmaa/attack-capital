// api/twilio/initial-twiml/route.ts
import { NextRequest } from "next/server";
import { twiml } from "twilio";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const amdStatus = formData.get("AnsweredBy");

  console.log(`INITIAL-TWIML (Sync): AMD status is: ${amdStatus}`);

  const response = new twiml.VoiceResponse();

  if (amdStatus === "human") {
    // AMD is complete. The human is waiting.
    response.say("Hello, a human has answered. Connecting you.");
    response.pause({ length: 60 }); // Or <Dial>
  } else {
    console.log("Not human. Hanging up.");
    response.hangup();
  }

  return new Response(response.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}
