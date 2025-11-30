import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type { AttendanceWithUser, User, AttendanceStatusType } from "@shared/schema";
import { AttendanceTable } from "@/components/AttendanceTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipboardList, Filter, X, Search } from "lucide-react";

type StatusFilter = AttendanceStatusType | "all";

export default function AllAttendancePage() {
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { data: employees } = useQuery<Omit<User, "password">[]>({
    queryKey: ["/api/users/employees"],
  });

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (employeeFilter !== "all") params.append("employeeId", employeeFilter);
    if (dateFilter) params.append("date", dateFilter);
    if (statusFilter !== "all") params.append("status", statusFilter);
    return params.toString();
  };

  const queryString = buildQueryString();
  const { data: attendanceData, isLoading } = useQuery<AttendanceWithUser[]>({
    queryKey: [`/api/attendance/all${queryString ? `?${queryString}` : ""}`],
  });

  const clearFilters = () => {
    setEmployeeFilter("all");
    setDateFilter("");
    setStatusFilter("all");
  };

  const hasActiveFilters =
    employeeFilter !== "all" || dateFilter !== "" || statusFilter !== "all";

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            All Attendance
          </h1>
          <p className="text-muted-foreground mt-1">
            View and filter attendance records for all employees
          </p>
        </div>
        <Badge variant="secondary" className="font-mono self-start">
          {attendanceData?.length || 0} records
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Employee</label>
              <Select
                value={employeeFilter}
                onValueChange={setEmployeeFilter}
              >
                <SelectTrigger data-testid="select-employee-filter">
                  <SelectValue placeholder="All Employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees?.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Date</label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                max={format(new Date(), "yyyy-MM-dd")}
                data-testid="input-date-filter"
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as StatusFilter)}
              >
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="half-day">Half Day</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="shrink-0"
                data-testid="button-clear-filters"
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Attendance Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceTable
            data={attendanceData || []}
            isLoading={isLoading}
            showEmployee={true}
            emptyMessage={
              hasActiveFilters
                ? "No records match the selected filters"
                : "No attendance records found"
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
