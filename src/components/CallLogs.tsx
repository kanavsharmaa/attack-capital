"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";
import {
  CallStatus,
  CallStrategy,
  CallLog,
} from "@/types/call.types";

interface CallLogsProps {
  logs: CallLog[];
  filterStrategy: CallStrategy;
  setFilterStrategy: (strategy: CallStrategy) => void;
  filterStatus: CallStatus;
  setFilterStatus: (status: CallStatus) => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
}

// Helper to format dates (for display)
const formatDate = (date: Date) => {
  return new Date(date).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

// Helper to style the status text
const getStatusColor = (status: Exclude<CallStatus, "ALL">) => {
  switch (status) {
    case CallStatus.HUMAN:
      return "text-green-400 font-semibold";
    case CallStatus.MACHINE:
      return "text-yellow-400 font-semibold";
    case CallStatus.HUMAN:
    case CallStatus.ERROR:
      return "text-red-400";
    case CallStatus.PENDING:
    default:
      return "text-neutral-400";
  }
};

const strategyOptions: { value: CallStrategy; label: string }[] = [
  { value: CallStrategy.ALL, label: "All Strategies" },
  { value: CallStrategy.TWILIO_NATIVE, label: "Twilio Native" },
  { value: CallStrategy.JAMBONZ, label: "Jambonz" },
  { value: CallStrategy.HUGGING_FACE, label: "Hugging Face" },
  { value: CallStrategy.GEMINI, label: "Gemini" },
];

const statusOptions: { value: CallStatus; label: string }[] = [
  { value: CallStatus.ALL, label: "All Statuses" },
  { value: CallStatus.HUMAN, label: "Human Detected" },
  { value: CallStatus.MACHINE, label: "Machine Detected" },
  { value: CallStatus.PENDING, label: "Pending" },
  { value: CallStatus.NO_ANSWER, label: "No Answer" },
  { value: CallStatus.ERROR, label: "Error" },
];

const handleExport = (logs: CallLog[]) => {
  // Frontend simulation of CSV export
  const headers = [
    "ID",
    "Date",
    "Target Number",
    "Strategy",
    "Status",
    "Twilio SID",
  ];
  const csvContent = [
    headers.join(","),
    ...logs.map((log) =>
      [
        log.id,
        log.createdAt.toISOString(),
        log.targetNumber,
        log.strategyUsed,
        log.status,
        log.twilioCallSid,
      ].join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "call_logs_export.csv");
  link.click();
  URL.revokeObjectURL(url);
};

export function CallLogs({
  logs,
  filterStrategy,
  setFilterStrategy,
  filterStatus,
  setFilterStatus,
  currentPage,
  totalPages,
  setCurrentPage,
}: CallLogsProps) {
  return (
    <Card className="bg-neutral-800 border-neutral-700 text-white col-span-2">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
        <div>
          <CardTitle>Call History</CardTitle>
          <CardDescription className="text-neutral-400">
            Paginated log of all outbound AMD attempts.
          </CardDescription>
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          {/* Filter Dropdowns */}
          <Select
            value={filterStrategy}
            onValueChange={(value) => setFilterStrategy(value as CallStrategy)}
          >
            <SelectTrigger className="w-[180px] bg-neutral-900 border-neutral-700">
              <SelectValue placeholder="Filter by Strategy" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-800 border-neutral-700 text-white">
              {strategyOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterStatus}
            onValueChange={(value) => setFilterStatus(value as CallStatus)}
          >
            <SelectTrigger className="w-[180px] bg-neutral-900 border-neutral-700">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-800 border-neutral-700 text-white">
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Export Button */}
          <Button
            variant="outline"
            className="bg-neutral-700 border-neutral-600 hover:bg-neutral-600"
            onClick={() => handleExport(logs)}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="border border-neutral-700 rounded-lg overflow-x-auto">
          <Table>
            <TableHeader className="bg-neutral-700">
              <TableRow className="hover:bg-neutral-700">
                <TableHead className="text-white w-[150px]">Date</TableHead>
                <TableHead className="text-white">Target Number</TableHead>
                <TableHead className="text-white">Strategy</TableHead>
                <TableHead className="text-white">Status</TableHead>
                <TableHead className="text-white">Twilio SID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="border-neutral-700 hover:bg-neutral-700/50"
                  >
                    <TableCell className="font-medium text-xs">
                      {formatDate(log.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.targetNumber}
                    </TableCell>
                    <TableCell className="text-xs text-neutral-300">
                      {log.strategyUsed}
                    </TableCell>
                    <TableCell className={getStatusColor(log.status)}>
                      {log.status.replace("_", " ")}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-neutral-500">
                      {log.twilioCallSid}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-neutral-400 py-8"
                  >
                    No call logs found matching current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="bg-neutral-700 border-neutral-600 hover:bg-neutral-600"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-neutral-400">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="bg-neutral-700 border-neutral-600 hover:bg-neutral-600"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
