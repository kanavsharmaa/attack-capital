// Simple per-process event bus for call updates
import { EventEmitter } from "events";

type CallEvent =
  | { type: "DIALING"; userId: string; callSid: string; to: string }
  | { type: "UPDATE"; userId: string; callSid: string; status: string }
  | { type: "ERROR";  userId: string; callSid: string; message: string };

class Bus extends EventEmitter {}
const globalForBus = global as unknown as { __CALL_BUS?: Bus };
export const callBus = globalForBus.__CALL_BUS ?? new Bus();
if (!globalForBus.__CALL_BUS) globalForBus.__CALL_BUS = callBus;

export function emitDialing(e: Extract<CallEvent, {type:"DIALING"}>) {
  callBus.emit(`user:${e.userId}`, e);
  callBus.emit(`call:${e.callSid}`, e);
}
export function emitUpdate(e: Extract<CallEvent, {type:"UPDATE"}>) {
  callBus.emit(`user:${e.userId}`, e);
  callBus.emit(`call:${e.callSid}`, e);
}
export function emitError(e: Extract<CallEvent, {type:"ERROR"}>) {
  callBus.emit(`user:${e.userId}`, e);
  callBus.emit(`call:${e.callSid}`, e);
}
