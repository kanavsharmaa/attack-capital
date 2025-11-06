"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Phone } from "lucide-react";
import { useState, FormEvent } from "react";
import { CallStrategy } from "@/types/call.types"; 

// Test numbers from the assignment
const TEST_NUMBERS = [
  { label: "Costco (Voicemail)", number: "+18007742678" },
  { label: "Nike (Voicemail)", number: "+18008066453" },
  { label: "PayPal (Voicemail)", number: "+18882211161" },
  { label: "Human (Mock)", number: "+12225550101" },
];

const AMD_STRATEGY_OPTIONS = [
  { value: CallStrategy.TWILIO_NATIVE, label: "Twilio Native AMD" },
  { value: CallStrategy.JAMBONZ, label: "Jambonz (SIP-Enhanced)" },
  { value: CallStrategy.HUGGING_FACE, label: "Hugging Face Model" },
  { value: CallStrategy.GEMINI, label: "Gemini 2.5 Flash" },
];

// FIX: Define DialerProps interface and use the imported CallStrategy type
interface DialerProps {
  onDial: (to: string, strategy: Exclude<CallStrategy, "ALL">) => Promise<void>;
  isDialing: boolean;
  initialStrategy: Exclude<CallStrategy, "ALL">;
}

export function Dialer({ onDial, isDialing, initialStrategy }: DialerProps) {
  const [targetNumber, setTargetNumber] = useState("");
  const [strategy, setStrategy] =
    useState<Exclude<CallStrategy, "ALL">>(initialStrategy);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (targetNumber && strategy && !isDialing) {
      onDial(targetNumber, strategy);
    }
  };

  return (
    <Card className="bg-neutral-800 border-neutral-700 text-white h-full">
      <CardHeader>
        <CardTitle>Initiate Outbound Call</CardTitle>
        <CardDescription className="text-neutral-400">
          Select a number and an AMD strategy to begin the call.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="targetNumber">Target Phone Number</Label>
            <Input
              id="targetNumber"
              type="tel"
              placeholder="E.g., +12225550101"
              value={targetNumber}
              onChange={(e) => setTargetNumber(e.target.value)}
              className="bg-neutral-900 border-neutral-700"
              disabled={isDialing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="strategy">AMD Strategy</Label>
            <Select
              value={strategy}
              onValueChange={(value) =>
                setStrategy(value as Exclude<CallStrategy, "ALL">)
              }
              disabled={isDialing}
            >
              <SelectTrigger id="strategy" className="bg-neutral-900 border-neutral-700">
                <SelectValue placeholder="Select a strategy" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700 text-white">
                {AMD_STRATEGY_OPTIONS.map((s) => (
                  <SelectItem
                    key={s.value}
                    value={s.value}
                    className="focus:bg-neutral-700"
                  >
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isDialing || !targetNumber || !strategy}
          >
            {isDialing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Phone className="mr-2 h-4 w-4" />
            )}
            {isDialing ? "Calling..." : "Dial Now"}
          </Button>
        </form>

        <div className="space-y-2">
          <Label>Quick Test Numbers</Label>
          <div className="grid grid-cols-2 gap-2">
            {TEST_NUMBERS.map((test) => (
              <Button
                key={test.number}
                variant="secondary"
                size="sm"
                onClick={() => setTargetNumber(test.number)}
                disabled={isDialing}
                className="bg-neutral-700 hover:bg-neutral-600 border-neutral-600 text-neutral-200 justify-start"
              >
                {test.label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}