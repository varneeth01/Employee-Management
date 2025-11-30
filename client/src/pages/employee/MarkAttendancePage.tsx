import { useQuery, useMutation } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { apiRequest, invalidateQueries } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Attendance } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  LogIn,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Timer,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export default function MarkAttendancePage() {
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: todayAttendance, isLoading } = useQuery<Attendance | null>({
    queryKey: ["/api/attendance/today"],
  });

  const checkInMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/attendance/checkin"),
    onSuccess: () => {
      invalidateQueries(["/api/attendance/today", "/api/dashboard/employee"]);
      toast({
        title: "Checked In Successfully!",
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
      invalidateQueries(["/api/attendance/today", "/api/dashboard/employee"]);
      toast({
        title: "Checked Out Successfully!",
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
      <div className="p-6 flex items-center justify-center min-h-[80vh]">
        <Skeleton className="h-96 w-full max-w-md" />
      </div>
    );
  }

  const hasCheckedIn = !!todayAttendance?.checkInTime;
  const hasCheckedOut = !!todayAttendance?.checkOutTime;
  const isComplete = hasCheckedIn && hasCheckedOut;

  const getStatusInfo = () => {
    if (!todayAttendance) {
      return {
        label: "Not Checked In",
        color: "text-muted-foreground",
        bgColor: "bg-muted",
      };
    }
    switch (todayAttendance.status) {
      case "present":
        return {
          label: "Present",
          color: "text-green-700 dark:text-green-400",
          bgColor: "bg-green-100 dark:bg-green-900/30",
        };
      case "late":
        return {
          label: "Late",
          color: "text-yellow-700 dark:text-yellow-400",
          bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
        };
      case "half-day":
        return {
          label: "Half Day",
          color: "text-orange-700 dark:text-orange-400",
          bgColor: "bg-orange-100 dark:bg-orange-900/30",
        };
      default:
        return {
          label: todayAttendance.status,
          color: "text-muted-foreground",
          bgColor: "bg-muted",
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="p-6 flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Mark Attendance</CardTitle>
          <CardDescription>
            {format(currentTime, "EEEE, MMMM d, yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center p-8 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
            <Clock className="h-16 w-16 mx-auto text-primary" />
            <p className="mt-4 text-5xl font-mono font-bold tracking-tight">
              {format(currentTime, "hh:mm:ss")}
            </p>
            <p className="text-lg text-muted-foreground mt-1">
              {format(currentTime, "a")}
            </p>
          </div>

          {todayAttendance && (
            <div className="space-y-3">
              <div className="flex items-center justify-center">
                <Badge className={cn("text-sm px-4 py-1", statusInfo.bgColor, statusInfo.color)}>
                  {statusInfo.label}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <LogIn className="h-5 w-5 mx-auto text-green-600 dark:text-green-400 mb-2" />
                  <p className="text-xs text-muted-foreground mb-1">Check In</p>
                  <p className="font-mono font-medium">
                    {todayAttendance.checkInTime
                      ? format(parseISO(todayAttendance.checkInTime), "hh:mm a")
                      : "--:--"}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <LogOut className="h-5 w-5 mx-auto text-red-600 dark:text-red-400 mb-2" />
                  <p className="text-xs text-muted-foreground mb-1">Check Out</p>
                  <p className="font-mono font-medium">
                    {todayAttendance.checkOutTime
                      ? format(parseISO(todayAttendance.checkOutTime), "hh:mm a")
                      : "--:--"}
                  </p>
                </div>
              </div>

              {todayAttendance.totalHours !== null && (
                <div className="p-4 rounded-lg bg-primary/10 text-center">
                  <Timer className="h-5 w-5 mx-auto text-primary mb-2" />
                  <p className="text-xs text-muted-foreground mb-1">Hours Worked</p>
                  <p className="text-2xl font-mono font-bold text-primary">
                    {todayAttendance.totalHours.toFixed(2)}h
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            {!hasCheckedIn ? (
              <Button
                className="w-full h-14 text-lg"
                onClick={() => checkInMutation.mutate()}
                disabled={checkInMutation.isPending}
                data-testid="button-check-in"
              >
                {checkInMutation.isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <LogIn className="mr-2 h-5 w-5" />
                )}
                Check In
              </Button>
            ) : !hasCheckedOut ? (
              <Button
                className="w-full h-14 text-lg"
                variant="secondary"
                onClick={() => checkOutMutation.mutate()}
                disabled={checkOutMutation.isPending}
                data-testid="button-check-out"
              >
                {checkOutMutation.isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <LogOut className="mr-2 h-5 w-5" />
                )}
                Check Out
              </Button>
            ) : (
              <div className="text-center p-6 rounded-lg bg-green-50 dark:bg-green-900/20">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-600 dark:text-green-400" />
                <p className="mt-3 text-lg font-medium text-green-700 dark:text-green-400">
                  Attendance Complete
                </p>
                <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                  Have a great rest of your day!
                </p>
              </div>
            )}
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
            <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Check-in before 9:15 AM is marked as "Present". After that, it's marked as "Late".
              Working less than 4 hours is marked as "Half Day".
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
