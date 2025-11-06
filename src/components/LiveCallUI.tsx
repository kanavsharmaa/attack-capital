"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PhoneOff, Speaker, User, Loader2 } from "lucide-react";

interface LiveCallUIProps {
  targetNumber: string;
  strategyUsed: string;
  handleHangup: () => void;
  isHangingUp: boolean;
}

export function LiveCallUI({
  targetNumber,
  strategyUsed,
  handleHangup,
  isHangingUp,
}: LiveCallUIProps) {
  return (
    <Card className="bg-green-800 border-green-700 text-white shadow-xl shadow-green-900/50 h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex flex-col">
          <CardTitle className="text-xl">Live Conversation</CardTitle>
          <CardDescription className="text-green-200">
            AMD successful: **Human** detected.
          </CardDescription>
        </div>
        <div className="text-sm font-semibold text-green-200">
          Strategy: {strategyUsed}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 flex flex-col items-center">
        {/* Call Status Indicator */}
        <div className="flex flex-col items-center justify-center space-y-3 p-4 bg-green-900/50 rounded-lg w-full max-w-sm">
          <User className="h-10 w-10 text-green-400 animate-pulse" />
          <p className="text-2xl font-bold">In Call</p>
          <p className="text-sm text-green-300">{targetNumber}</p>
        </div>

        {/* In-Call Controls */}
        <div className="flex space-x-6">
          <Button
            variant="default"
            size="lg"
            className="bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/50 transform transition-transform hover:scale-105"
            onClick={handleHangup}
            disabled={isHangingUp}
          >
            {isHangingUp ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <PhoneOff className="mr-2 h-5 w-5" />
            )}
            {isHangingUp ? "Hanging up..." : "Hang Up"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
