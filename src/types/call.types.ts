// Matches the Prisma CallStrategy enum
export const CallStrategy = {
  TWILIO_NATIVE: "TWILIO_NATIVE",
  JAMBONZ: "JAMBONZ",
  HUGGING_FACE: "HUGGING_FACE",
  GEMINI: "GEMINI",
  ALL: "ALL", // 'ALL' is for frontend filtering only
} as const;

export type CallStrategy = (typeof CallStrategy)[keyof typeof CallStrategy];

// Matches the Prisma CallStatus enum
export const CallStatus = {
  PENDING: "PENDING",
  HUMAN: "HUMAN",
  MACHINE: "MACHINE",
  NO_ANSWER: "NO_ANSWER",
  ERROR: "ERROR",
  ALL: "ALL", // 'ALL' is for frontend filtering only
} as const;

export type CallStatus = (typeof CallStatus)[keyof typeof CallStatus];

// Live call status for UI
export interface LiveCallStatus {
  status:
    | Exclude<CallStatus, "ALL">
    | "IDLE"
    | "DIALING"
    | "RINGING"
    | "CONNECTING";
  message: string;
}

// Log entry for completed calls
export interface CallLog {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  targetNumber: string;
  strategyUsed: Exclude<CallStrategy, "ALL">;
  status: Exclude<CallStatus, "ALL">;
  twilioCallSid: string;
}

// Live call status for UI
export interface LiveCallStatus {
  status:
    | Exclude<CallStatus, "ALL">
    | "IDLE"
    | "DIALING"
    | "RINGING"
    | "CONNECTING";
  message: string;
}
