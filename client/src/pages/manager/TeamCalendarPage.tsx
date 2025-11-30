import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import type { AttendanceWithUser, User, AttendanceStatusType } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const statusStyles: Record<AttendanceStatusType | "not-marked", { bg: string; text: string; label: string }> = {
  present: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
    label: "Present",
  },
  absent: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    label: "Absent",
  },
  late: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-700 dark:text-yellow-400",
    label: "Late",
  },
  "half-day": {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-400",
    label: "Half Day",
  },
  "not-marked": {
    bg: "bg-muted",
    text: "text-muted-foreground",
    label: "Not Marked",
  },
};

export default function TeamCalendarPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );

  const { data: employees, isLoading: employeesLoading } = useQuery<Omit<User, "password">[]>({
    queryKey: ["/api/users/employees"],
  });

  const { data: attendanceData, isLoading: attendanceLoading } = useQuery<AttendanceWithUser[]>({
    queryKey: ["/api/attendance/today-status", selectedDate],
  });

  const isLoading = employeesLoading || attendanceLoading;

  const getEmployeeStatus = (employeeId: string): AttendanceStatusType | "not-marked" => {
    const record = attendanceData?.find((a) => a.userId === employeeId);
    return record?.status || "not-marked";
  };

  const getEmployeeAttendance = (employeeId: string) => {
    return attendanceData?.find((a) => a.userId === employeeId);
  };

  const presentCount = attendanceData?.filter((a) => a.status === "present").length || 0;
  const lateCount = attendanceData?.filter((a) => a.status === "late").length || 0;
  const absentCount = (employees?.filter(e => e.role === "employee").length || 0) - (attendanceData?.length || 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            Team Calendar
          </h1>
          <p className="text-muted-foreground mt-1">
            View team attendance for any date
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={format(new Date(), "yyyy-MM-dd")}
            className="w-auto"
            data-testid="input-date-picker"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{presentCount}</p>
                <p className="text-xs text-muted-foreground">Present</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{lateCount}</p>
                <p className="text-xs text-muted-foreground">Late</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <Users className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{absentCount >= 0 ? absentCount : 0}</p>
                <p className="text-xs text-muted-foreground">Absent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Status for {format(parseISO(selectedDate), "MMMM d, yyyy")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : employees?.filter(e => e.role === "employee").length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No employees found</p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Employee</TableHead>
                    <TableHead className="font-semibold">Department</TableHead>
                    <TableHead className="font-semibold">Check In</TableHead>
                    <TableHead className="font-semibold">Check Out</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees?.filter(e => e.role === "employee").map((employee) => {
                    const status = getEmployeeStatus(employee.id);
                    const attendance = getEmployeeAttendance(employee.id);
                    const statusStyle = statusStyles[status];

                    return (
                      <TableRow key={employee.id} className="hover-elevate">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="text-sm">
                                {employee.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{employee.name}</p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {employee.employeeId}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {employee.department}
                        </TableCell>
                        <TableCell>
                          {attendance?.checkInTime ? (
                            <span className="font-mono text-sm">
                              {format(parseISO(attendance.checkInTime), "hh:mm a")}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {attendance?.checkOutTime ? (
                            <span className="font-mono text-sm">
                              {format(parseISO(attendance.checkOutTime), "hh:mm a")}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={cn("font-medium", statusStyle.bg, statusStyle.text)}
                          >
                            {statusStyle.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
