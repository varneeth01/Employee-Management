import { useQuery, useMutation } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { apiRequest, invalidateQueries } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { EmployeeDashboardStats } from "@shared/schema";
import { StatsCard } from "@/components/StatsCard";
import { AttendanceTable } from "@/components/AttendanceTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  XCircle,
  Clock,
  CalendarCheck,
  AlertTriangle,
  Timer,
  LogIn,
  LogOut,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function EmployeeDashboard() {
  const { toast } = useToast();

  const { data: stats, isLoading } = useQuery<EmployeeDashboardStats>({
    queryKey: ["/api/dashboard/employee"],
  });

  const checkInMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/attendance/checkin"),
    onSuccess: () => {
      invalidateQueries(["/api/dashboard/employee", "/api/attendance/today"]);
      toast({
        title: "Checked In!",
        description: `You've checked in at ${format(new Date(), "hh:mm a")}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Check-in failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/attendance/checkout"),
    onSuccess: () => {
      invalidateQueries(["/api/dashboard/employee", "/api/attendance/today"]);
      toast({
        title: "Checked Out!",
        description: `You've checked out at ${format(new Date(), "hh:mm a")}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Check-out failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const todayStatus = stats?.todayStatus;
  const monthStats = stats?.monthStats || { present: 0, absent: 0, late: 0, halfDay: 0 };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight" data-testid="text-page-title">Dashboard</h1>
        <p className="text-muted-foreground mt-2 text-base">
          Welcome back! Here's your attendance overview.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Today's Status"
          value={
            todayStatus?.checkedIn
              ? todayStatus.checkedOut
                ? "Complete"
                : "Checked In"
              : "Not Checked In"
          }
          subtitle={
            todayStatus?.checkInTime
              ? `Since ${format(parseISO(todayStatus.checkInTime), "hh:mm a")}`
              : "Mark your attendance"
          }
          icon={todayStatus?.checkedIn ? CheckCircle2 : XCircle}
          iconColor={todayStatus?.checkedIn ? "text-green-600" : "text-muted-foreground"}
        />

        <StatsCard
          title="Present Days"
          value={monthStats.present}
          subtitle="This month"
          icon={CalendarCheck}
          iconColor="text-green-600"
        />

        <StatsCard
          title="Late Arrivals"
          value={monthStats.late}
          subtitle="This month"
          icon={AlertTriangle}
          iconColor="text-yellow-600"
        />

        <StatsCard
          title="Hours Worked"
          value={`${stats?.totalHoursThisMonth?.toFixed(1) || 0}h`}
          subtitle="This month"
          icon={Timer}
          iconColor="text-primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>Recent Attendance</CardTitle>
            <Badge variant="secondary" className="font-mono text-xs">
              Last 7 days
            </Badge>
          </CardHeader>
          <CardContent>
            <AttendanceTable
              data={stats?.recentAttendance || []}
              emptyMessage="No attendance records in the last 7 days"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-6 rounded-lg bg-muted/50">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="mt-3 text-2xl font-mono font-bold">
                {format(new Date(), "hh:mm a")}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(), "EEEE, MMMM d, yyyy")}
              </p>
            </div>

            {todayStatus?.status && (
              <div className="flex items-center justify-center">
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-sm",
                    todayStatus.status === "present" && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
                    todayStatus.status === "late" && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
                    todayStatus.status === "half-day" && "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                  )}
                >
                  Today: {todayStatus.status.charAt(0).toUpperCase() + todayStatus.status.slice(1)}
                </Badge>
              </div>
            )}

            <div className="space-y-3">
              {!todayStatus?.checkedIn ? (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => checkInMutation.mutate()}
                  disabled={checkInMutation.isPending}
                  data-testid="button-check-in"
                >
                  {checkInMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogIn className="mr-2 h-4 w-4" />
                  )}
                  Check In
                </Button>
              ) : !todayStatus?.checkedOut ? (
                <Button
                  className="w-full"
                  size="lg"
                  variant="secondary"
                  onClick={() => checkOutMutation.mutate()}
                  disabled={checkOutMutation.isPending}
                  data-testid="button-check-out"
                >
                  {checkOutMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="mr-2 h-4 w-4" />
                  )}
                  Check Out
                </Button>
              ) : (
                <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <CheckCircle2 className="h-8 w-8 mx-auto text-green-600 dark:text-green-400" />
                  <p className="mt-2 font-medium text-green-700 dark:text-green-400">
                    Today's attendance complete
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-500">
                    {todayStatus.checkInTime && todayStatus.checkOutTime && (
                      <>
                        {format(parseISO(todayStatus.checkInTime), "hh:mm a")} -{" "}
                        {format(parseISO(todayStatus.checkOutTime), "hh:mm a")}
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Monthly Summary</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {monthStats.present}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-500">Present</p>
                </div>
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                    {monthStats.absent}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-500">Absent</p>
                </div>
                <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                  <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                    {monthStats.late}
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-500">Late</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                    {monthStats.halfDay}
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-500">Half Day</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
