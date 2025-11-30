import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import type { AttendanceWithUser, User } from "@shared/schema";
import { AttendanceTable } from "@/components/AttendanceTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Download, Calendar, Loader2 } from "lucide-react";

export default function ReportsPage() {
  const { toast } = useToast();
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>(
    format(subDays(new Date(), 30), "yyyy-MM-dd")
  );
  const [toDate, setToDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [isExporting, setIsExporting] = useState(false);

  const { data: employees } = useQuery<Omit<User, "password">[]>({
    queryKey: ["/api/users/employees"],
  });

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (employeeFilter !== "all") params.append("employeeId", employeeFilter);
    if (fromDate) params.append("from", fromDate);
    if (toDate) params.append("to", toDate);
    return params.toString();
  };

  const queryString = buildQueryString();
  const { data: reportData, isLoading } = useQuery<AttendanceWithUser[]>({
    queryKey: [`/api/attendance/all${queryString ? `?${queryString}` : ""}`],
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (employeeFilter !== "all") params.append("employeeId", employeeFilter);
      if (fromDate) params.append("from", fromDate);
      if (toDate) params.append("to", toDate);

      const token = localStorage.getItem("token");
      const response = await fetch(`/api/attendance/export?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export successful",
        description: "Your attendance report has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export the attendance report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            Attendance Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate and export attendance reports
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={isExporting || !reportData?.length}
          data-testid="button-export-csv"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Report Filters
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
              <label className="text-sm font-medium mb-2 block">From Date</label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                max={toDate}
                data-testid="input-from-date"
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">To Date</label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                min={fromDate}
                max={format(new Date(), "yyyy-MM-dd")}
                data-testid="input-to-date"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Preview
          </CardTitle>
          <Badge variant="secondary" className="font-mono">
            {reportData?.length || 0} records
          </Badge>
        </CardHeader>
        <CardContent>
          <AttendanceTable
            data={reportData || []}
            isLoading={isLoading}
            showEmployee={true}
            emptyMessage="No records found for the selected criteria"
          />
        </CardContent>
      </Card>
    </div>
  );
}
