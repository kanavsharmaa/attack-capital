"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LiveCallStatus } from "@/types/call.types";
import { Loader2, Phone, PhoneOff, User, Voicemail } from "lucide-react";

interface LiveStatusProps {
  liveStatus: LiveCallStatus; // 👈 use imported type
}

const StatusDisplay = ({ status }: { status: LiveCallStatus["status"] }) => {
  switch (status) {
    case "DIALING":
    case "RINGING":
      return (
        <div className="flex items-center text-blue-400">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          In Progress...
        </div>
      );
    case "HUMAN":
      return (
        <div className="flex items-center text-green-400">
          <User className="mr-2 h-4 w-4" />
          Human Detected
        </div>
      );
    case "MACHINE":
      return (
        <div className="flex items-center text-yellow-400">
          <Voicemail className="mr-2 h-4 w-4" />
          Machine Detected
        </div>
      );
    case "ERROR":
      return (
        <div className="flex items-center text-red-400">
          <PhoneOff className="mr-2 h-4 w-4" />
          Call Failed
        </div>
      );
    case "IDLE":
    default:
      return (
        <div className="flex items-center text-neutral-400">
          <Phone className="mr-2 h-4 w-4" />
          Waiting for call...
        </div>
      );
  }
};

export function LiveStatus({ liveStatus }: LiveStatusProps) {
  return (
    <Card className="bg-neutral-800 border-neutral-700 text-white h-full">
      <CardHeader>
        <CardTitle>Live Call Status</CardTitle>
        <CardDescription className="text-neutral-400">
          Real-time AMD results for the latest call.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col justify-center items-center h-full pb-10">
        <div className="text-lg font-medium mb-2">
          <StatusDisplay status={liveStatus.status} />
        </div>
        <p className="text-sm text-neutral-300 text-center">
          {liveStatus.message}
        </p>
      </CardContent>
    </Card>
  );
}
