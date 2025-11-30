import { useQuery } from "@tanstack/react-query";
import type { ManagerDashboardStats } from "@shared/schema";
import { StatsCard } from "@/components/StatsCard";
import { WeeklyTrendChart } from "@/components/WeeklyTrendChart";
import { DepartmentChart } from "@/components/DepartmentChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  TrendingUp,
  Building2,
  AlertTriangle,
} from "lucide-react";
import { format, parseISO } from "date-fns";

export default function ManagerDashboard() {
  const { data: stats, isLoading } = useQuery<ManagerDashboardStats>({
    queryKey: ["/api/dashboard/manager"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const todayStats = stats?.today || { present: 0, absent: 0, late: 0 };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">
          Manager Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Team attendance overview for {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Employees"
          value={stats?.totalEmployees || 0}
          subtitle="Active team members"
          icon={Users}
          iconColor="text-primary"
        />

        <StatsCard
          title="Present Today"
          value={todayStats.present}
          subtitle={`${stats?.totalEmployees ? Math.round((todayStats.present / stats.totalEmployees) * 100) : 0}% attendance`}
          icon={UserCheck}
          iconColor="text-green-600"
        />

        <StatsCard
          title="Absent Today"
          value={todayStats.absent}
          subtitle="Not checked in"
          icon={UserX}
          iconColor="text-red-600"
        />

        <StatsCard
          title="Late Today"
          value={todayStats.late}
          subtitle="Arrived after 9:15 AM"
          icon={Clock}
          iconColor="text-yellow-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Weekly Attendance Trend
            </CardTitle>
            <Badge variant="secondary" className="font-mono text-xs">
              Last 7 days
            </Badge>
          </CardHeader>
          <CardContent>
            {stats?.weeklyTrend && stats.weeklyTrend.length > 0 ? (
              <WeeklyTrendChart data={stats.weeklyTrend} />
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No trend data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Department Attendance
            </CardTitle>
            <Badge variant="secondary" className="font-mono text-xs">
              This month
            </Badge>
          </CardHeader>
          <CardContent>
            {stats?.departmentWise && stats.departmentWise.length > 0 ? (
              <DepartmentChart data={stats.departmentWise} />
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No department data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Late Arrivals Today
            </CardTitle>
            <Badge variant="secondary">{stats?.lateToday?.length || 0}</Badge>
          </CardHeader>
          <CardContent>
            {stats?.lateToday && stats.lateToday.length > 0 ? (
              <div className="space-y-3">
                {stats.lateToday.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover-elevate"
                    data-testid={`late-employee-${employee.id}`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-sm">
                        {employee.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{employee.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {employee.department} | {employee.employeeId}
                      </p>
                    </div>
                    <Badge variant="secondary" className="font-mono text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                      {format(parseISO(employee.checkInTime), "hh:mm a")}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No late arrivals today</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-600" />
              Absent Today
            </CardTitle>
            <Badge variant="secondary">{stats?.absentToday?.length || 0}</Badge>
          </CardHeader>
          <CardContent>
            {stats?.absentToday && stats.absentToday.length > 0 ? (
              <div className="space-y-3">
                {stats.absentToday.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover-elevate"
                    data-testid={`absent-employee-${employee.id}`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-sm">
                        {employee.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{employee.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {employee.department} | {employee.employeeId}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      Absent
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Everyone is present today!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
