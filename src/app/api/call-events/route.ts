/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { callBus } from "@/lib/event-bus";

export const runtime = "nodejs";

const TERMINAL = new Set(["HUMAN", "MACHINE", "NO_ANSWER", "ERROR"]);

export async function GET(req: NextRequest) {
  // auth the SSE request
  const h = await headers();
  const session = await auth.api.getSession({ headers: new Headers(h) });
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;

  // optional: narrow to a single call
  const { searchParams } = new URL(req.url);
  const callSidFilter = searchParams.get("callSid"); // optional

  const stream = new ReadableStream({
    start(controller) {
      const write = (event: any) => {
        controller.enqueue(
          `data: ${JSON.stringify(event)}\n\n`
        );
      };

      // Initial ping so the client knows we're live
      write({ type: "READY" });

      // Keep-alive heartbeat (Heroku/NGROK friendly)
      const heartbeat = setInterval(() => controller.enqueue(`:keep-alive\n\n`), 15000);

      const handler = (evt: any) => {
        if (callSidFilter && evt.callSid !== callSidFilter) return;
        write(evt);
        if (evt.type === "UPDATE" && TERMINAL.has(evt.status)) {
          // Allow client to auto-close; we keep stream open in case they monitor multiple calls.
          // If you want auto-close, uncomment:
          // controller.close();
        }
      };

      const key = callSidFilter ? `call:${callSidFilter}` : `user:${userId}`;
      callBus.on(key, handler);

      const cancel = () => {
        clearInterval(heartbeat);
        callBus.off(key, handler);
        controller.close();
      };

      // close on client disconnect
      req.signal?.addEventListener("abort", cancel);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
