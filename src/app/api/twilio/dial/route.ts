/* eslint-disable @typescript-eslint/no-explicit-any */
// Download the helper library from https://www.twilio.com/docs/node/install
import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure

if (
  !process.env.TWILIO_ACCOUNT_SID ||
  !process.env.TWILIO_AUTH_TOKEN ||
  !process.env.TWILIO_PHONE_NUMBER ||
  !process.env.NEXT_PUBLIC_APP_URL
) {
  throw new Error("Credentials required. Error in Dial Route");
}

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const baseURL = process.env.NEXT_PUBLIC_APP_URL;

const client = twilio(accountSid, authToken);

export async function POST(req: NextRequest) {
  try {
    const { to } = await req.json();

    if (!to) {
      return NextResponse.json({ error: "Missing 'to' number" }, { status: 400 });
    }

    const call = await client.calls.create({
      from: twilioPhoneNumber,
      to,
      url: `${baseURL}/api/twilio/initial-twiml`,
      machineDetection: 'Enable',
      statusCallback: `${baseURL}/api/twilio/status-callback`, // Add a route here 
    });
  
    console.log("Call details:", call);
  
    return NextResponse.json({ callSid: call.sid }, { status: 200 });
  } catch (err : any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
    
  }
}
