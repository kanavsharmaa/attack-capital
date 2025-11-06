"use client";

import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef, // ⬅️ added
} from "react";
import { LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Dialer } from "@/components/Dialer";
import { LiveStatus } from "@/components/LiveStatus";
import { CallLogs } from "@/components/CallLogs";
import { LiveCallUI } from "@/components/LiveCallUI";

import type {
  CallLog,
  CallStrategy,
  CallStatus,
  LiveCallStatus,
} from "@/types/call.types";

const AMD_STRATEGIES: Exclude<CallStrategy, "ALL">[] = [
  "TWILIO_NATIVE",
  "JAMBONZ",
  "HUGGING_FACE",
  "GEMINI",
];

const LOGS_PER_PAGE = 5;

interface CallState {
  status: LiveCallStatus["status"];
  message: string;
  targetNumber: string;
  strategyUsed: Exclude<CallStrategy, "ALL">;
  callSid: string | null;
}

const INITIAL_CALL_STATE: CallState = {
  status: "IDLE",
  message: "Ready to initiate a new call.",
  targetNumber: "",
  strategyUsed: AMD_STRATEGIES[0],
  callSid: null,
};

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [currentCallState, setCurrentCallState] =
    useState<CallState>(INITIAL_CALL_STATE);
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [filterStrategy, setFilterStrategy] = useState<CallStrategy>("ALL");
  const [filterStatus, setFilterStatus] = useState<CallStatus>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [isHangingUp, setIsHangingUp] = useState(false);

  // SSE ref
  const esRef = useRef<EventSource | null>(null);

  // Authentication & Redirect
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/sign-in");
    }
  }, [isPending, session, router]);

  // Fetch call logs
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("/api/call-logs");
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/sign-in");
            return;
          }
          throw new Error("Failed to fetch call logs");
        }
        const data: CallLog[] = await res.json();

        // Parse date strings back to Date objects
        const parsedLogs = data.map((log) => ({
          ...log,
          createdAt: new Date(log.createdAt),
          updatedAt: new Date(log.updatedAt),
        }));

        setLogs(parsedLogs);
      } catch (err) {
        console.error("Error loading call logs:", err);
      }
    };

    if (session?.user) {
      fetchLogs();
    }
  }, [session, router]);

  // Filter logs based on strategy and status
  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) => {
        const strategyMatch =
          filterStrategy === "ALL" || log.strategyUsed === filterStrategy;
        const statusMatch =
          filterStatus === "ALL" || log.status === filterStatus;
        return strategyMatch && statusMatch;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [logs, filterStrategy, filterStatus]);

  // Paginate filtered logs
  const totalPages = Math.ceil(filteredLogs.length / LOGS_PER_PAGE);
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * LOGS_PER_PAGE;
    const end = start + LOGS_PER_PAGE;
    return filteredLogs.slice(start, end);
  }, [filteredLogs, currentPage]);

  // Reset page when total pages change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (currentPage > 1 && totalPages === 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Subscribe to SSE stream for a specific callSid
  const subscribeToCall = useCallback(
    (callSid: string) => {
      // Close any previous stream
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }

      const es = new EventSource(
        `/api/call-events?callSid=${encodeURIComponent(callSid)}`
      );
      esRef.current = es;

      es.onmessage = async (e) => {
        if (!e.data) return;
        const evt = JSON.parse(e.data);

        if (evt.type === "READY") return;

        if (evt.type === "DIALING") {
          setCurrentCallState((s) => ({
            ...s,
            status: "DIALING",
            message: `Dialing ${evt.to}...`,
          }));
          return;
        }

        if (evt.type === "UPDATE") {
          const status = evt.status as LiveCallStatus["status"]; // HUMAN | MACHINE | NO_ANSWER | ERROR | etc.

          setCurrentCallState((s) => ({
            ...s,
            status,
            message:
              status === "HUMAN"
                ? "Human detected. Connecting to live UI…"
                : status === "MACHINE"
                ? "Voicemail detected — call ended."
                : status === "NO_ANSWER"
                ? "No answer/busy — call ended."
                : status === "ERROR"
                ? "Call failed."
                : `Status: ${status}`,
          }));

          // On terminal states, close stream and refresh logs
          if (["HUMAN", "MACHINE", "NO_ANSWER", "ERROR"].includes(status)) {
            try {
              es.close();
              esRef.current = null;

              const logsRes = await fetch("/api/call-logs");
              if (logsRes.ok) {
                const data: CallLog[] = await logsRes.json();
                const parsed = data.map((log) => ({
                  ...log,
                  createdAt: new Date(log.createdAt),
                  updatedAt: new Date(log.updatedAt),
                }));
                setLogs(parsed);
              }
            } catch (err) {
              console.error(
                "Failed to refresh logs after terminal update:",
                err
              );
            }
          }
        }
      };

      es.onerror = () => {
        try {
          es.close();
        } catch {}
        esRef.current = null;
      };
    },
    [setCurrentCallState, setLogs]
  );

  // Cleanup SSE on unmount or route change
  useEffect(() => {
    return () => {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, []);

  // Handle dialing a new call
  const handleDial = useCallback(
    async (to: string, strategy: Exclude<CallStrategy, "ALL">) => {
      if (!session?.user?.id) {
        console.error("Missing user ID");
        return;
      }

      setCurrentCallState({
        status: "DIALING",
        message: `Dialing ${to} using ${strategy}...`,
        targetNumber: to,
        strategyUsed: strategy,
        callSid: null,
      });

      try {
        const res = await fetch("/api/twilio/dial", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to,
            userId: session.user.id,
          }),
        });

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            router.push("/sign-in");
            return;
          }
          const errorData = await res.json();
          throw new Error(errorData.error || "Dial request failed");
        }

        const { callSid } = await res.json();

        setCurrentCallState({
          status: "RINGING",
          message: `Call initiated (SID: ${callSid})`,
          targetNumber: to,
          strategyUsed: strategy,
          callSid: callSid,
        });

        // Open the live stream for this call
        subscribeToCall(callSid);

        // Optional: quick log refresh to show the new row immediately
        setTimeout(async () => {
          try {
            const logsRes = await fetch("/api/call-logs");
            if (logsRes.ok) {
              const data: CallLog[] = await logsRes.json();
              const parsedLogs = data.map((log) => ({
                ...log,
                createdAt: new Date(log.createdAt),
                updatedAt: new Date(log.updatedAt),
              }));
              setLogs(parsedLogs);
            }
          } catch (err) {
            console.error("Failed to refresh logs:", err);
          }
        }, 500);
      } catch (err) {
        console.error("Call failed:", err);
        setCurrentCallState({
          status: "ERROR",
          message:
            err instanceof Error ? err.message : "Failed to initiate call.",
          targetNumber: "",
          strategyUsed: AMD_STRATEGIES[0],
          callSid: null,
        });
      }
    },
    [session, router, subscribeToCall]
  );

  // Handle hanging up the call (local UI reset)
  const handleHangup = useCallback(async () => {
    setIsHangingUp(true); // Set loading state

    const { callSid } = currentCallState;

    if (callSid) {
      try {
        // Call our new API endpoint
        await fetch("/api/twilio/hangup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callSid }),
        });
        // Note: We don't care about the response. We'll just reset the UI.
        // The status-callback webhook will handle the DB update.
      } catch (err) {
        console.error("Failed to send hangup request:", err);
        // Still reset UI even if API call fails
      }
    }

    // Close the event stream
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    // Reset the UI
    setCurrentCallState(INITIAL_CALL_STATE);
    setIsHangingUp(false); // Unset loading state
  }, [currentCallState]); // Add currentCallState as dependency

  // Loading state
  if (isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-900 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </main>
    );
  }

  // Not authenticated
  if (!session?.user) {
    return <p className="text-center mt-8 text-white">Redirecting...</p>;
  }

  const { user } = session;
  const inLiveCall = currentCallState.status === "HUMAN";
  const isDialing = ["DIALING", "RINGING"].includes(currentCallState.status);

  return (
    <main className="flex min-h-screen flex-col p-6 bg-neutral-900 text-white">
      {/* Header */}
      <header className="flex justify-between items-center w-full max-w-7xl mx-auto mb-6 pt-4">
        <h1 className="text-2xl font-bold">Advanced AMD Dashboard</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-neutral-400 hidden sm:inline">
            Logged in as: {user.email}
          </span>
          <Button
            variant="outline"
            className="bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-white"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dialer or Live Call UI */}
        <section className="lg:col-span-2">
          {inLiveCall ? (
            <LiveCallUI
              targetNumber={currentCallState.targetNumber}
              strategyUsed={currentCallState.strategyUsed}
              handleHangup={handleHangup}
              isHangingUp={isHangingUp}
            />
          ) : (
            <Dialer
              onDial={handleDial}
              isDialing={isDialing}
              initialStrategy={currentCallState.strategyUsed}
            />
          )}
        </section>

        {/* Live Status */}
        <aside className="lg:col-span-1">
          <LiveStatus
            liveStatus={{
              status: currentCallState.status,
              message: currentCallState.message,
            }}
          />
        </aside>

        {/* Call Logs */}
        <section className="lg:col-span-3 mt-4">
          <CallLogs
            logs={paginatedLogs}
            filterStrategy={filterStrategy}
            setFilterStrategy={setFilterStrategy}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
        </section>
      </div>
    </main>
  );
}
