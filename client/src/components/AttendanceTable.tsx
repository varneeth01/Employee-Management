import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { AttendanceWithUser, AttendanceStatusType } from "@shared/schema";
import { format, parseISO } from "date-fns";
import { Clock, Calendar, User as UserIcon } from "lucide-react";

interface AttendanceTableProps {
  data: AttendanceWithUser[];
  isLoading?: boolean;
  showEmployee?: boolean;
  emptyMessage?: string;
}

const statusStyles: Record<AttendanceStatusType, string> = {
  present: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  absent: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  late: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "half-day": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
};

const statusLabels: Record<AttendanceStatusType, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  "half-day": "Half Day",
};

export function AttendanceTable({
  data,
  isLoading = false,
  showEmployee = false,
  emptyMessage = "No attendance records found",
}: AttendanceTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Calendar className="h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Date</TableHead>
            {showEmployee && <TableHead className="font-semibold">Employee</TableHead>}
            <TableHead className="font-semibold">Check In</TableHead>
            <TableHead className="font-semibold">Check Out</TableHead>
            <TableHead className="font-semibold">Hours</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((record) => (
            <TableRow key={record.id} className="hover-elevate" data-testid={`attendance-row-${record.id}`}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {format(parseISO(record.date), "MMM dd, yyyy")}
                </div>
              </TableCell>
              {showEmployee && (
                <TableCell>
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{record.user?.name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {record.user?.employeeId}
                      </p>
                    </div>
                  </div>
                </TableCell>
              )}
              <TableCell>
                {record.checkInTime ? (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-sm">
                      {format(parseISO(record.checkInTime), "hh:mm a")}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {record.checkOutTime ? (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-sm">
                      {format(parseISO(record.checkOutTime), "hh:mm a")}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <span className="font-mono text-sm">
                  {record.totalHours !== null ? `${record.totalHours.toFixed(1)}h` : "-"}
                </span>
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={cn("font-medium", statusStyles[record.status])}
                >
                  {statusLabels[record.status]}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
