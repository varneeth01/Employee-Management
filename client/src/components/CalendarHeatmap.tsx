import { cn } from "@/lib/utils";
import type { Attendance, AttendanceStatusType } from "@shared/schema";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isToday,
  isFuture,
  parseISO,
} from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CalendarHeatmapProps {
  month: Date;
  attendanceData: Attendance[];
  onDateClick?: (date: Date) => void;
}

const statusColors: Record<AttendanceStatusType | "empty" | "future", string> = {
  present: "bg-green-500 dark:bg-green-600",
  absent: "bg-red-500 dark:bg-red-600",
  late: "bg-yellow-500 dark:bg-yellow-600",
  "half-day": "bg-orange-500 dark:bg-orange-600",
  empty: "bg-muted",
  future: "bg-muted/30",
};

const statusLabels: Record<AttendanceStatusType, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  "half-day": "Half Day",
};

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarHeatmap({ month, attendanceData, onDateClick }: CalendarHeatmapProps) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);

  const attendanceMap = new Map<string, Attendance>();
  attendanceData.forEach((record) => {
    const dateKey = format(parseISO(record.date), "yyyy-MM-dd");
    attendanceMap.set(dateKey, record);
  });

  const getStatusForDate = (date: Date): AttendanceStatusType | "empty" | "future" => {
    if (isFuture(date) && !isToday(date)) return "future";
    const dateKey = format(date, "yyyy-MM-dd");
    const record = attendanceMap.get(dateKey);
    if (record) return record.status;
    if (isFuture(date)) return "future";
    return "empty";
  };

  const getAttendanceForDate = (date: Date): Attendance | undefined => {
    const dateKey = format(date, "yyyy-MM-dd");
    return attendanceMap.get(dateKey);
  };

  return (
    <div className="w-full" data-testid="calendar-heatmap">
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {days.map((date) => {
          const status = getStatusForDate(date);
          const attendance = getAttendanceForDate(date);
          const isTodayDate = isToday(date);

          return (
            <Tooltip key={date.toISOString()}>
              <TooltipTrigger asChild>
                <button
                  className={cn(
                    "aspect-square rounded-md flex items-center justify-center text-sm font-medium transition-all",
                    statusColors[status],
                    status !== "empty" && status !== "future" && "text-white",
                    isTodayDate && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                    status === "empty" && "text-muted-foreground",
                    status === "future" && "text-muted-foreground/50 cursor-not-allowed",
                    status !== "future" && "hover:scale-105 cursor-pointer"
                  )}
                  onClick={() => status !== "future" && onDateClick?.(date)}
                  disabled={status === "future"}
                  data-testid={`calendar-day-${format(date, "yyyy-MM-dd")}`}
                >
                  {format(date, "d")}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">
                  <p className="font-medium">{format(date, "MMMM d, yyyy")}</p>
                  {attendance ? (
                    <>
                      <p className="text-muted-foreground">
                        Status: {statusLabels[attendance.status]}
                      </p>
                      {attendance.checkInTime && (
                        <p className="text-muted-foreground">
                          Check In: {format(parseISO(attendance.checkInTime), "hh:mm a")}
                        </p>
                      )}
                      {attendance.checkOutTime && (
                        <p className="text-muted-foreground">
                          Check Out: {format(parseISO(attendance.checkOutTime), "hh:mm a")}
                        </p>
                      )}
                      {attendance.totalHours !== null && (
                        <p className="text-muted-foreground">
                          Hours: {attendance.totalHours.toFixed(1)}h
                        </p>
                      )}
                    </>
                  ) : status === "future" ? (
                    <p className="text-muted-foreground">Future date</p>
                  ) : (
                    <p className="text-muted-foreground">No record</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className={cn("h-3 w-3 rounded-sm", statusColors.present)} />
          <span className="text-xs text-muted-foreground">Present</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("h-3 w-3 rounded-sm", statusColors.late)} />
          <span className="text-xs text-muted-foreground">Late</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("h-3 w-3 rounded-sm", statusColors["half-day"])} />
          <span className="text-xs text-muted-foreground">Half Day</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("h-3 w-3 rounded-sm", statusColors.absent)} />
          <span className="text-xs text-muted-foreground">Absent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("h-3 w-3 rounded-sm", statusColors.empty)} />
          <span className="text-xs text-muted-foreground">No Record</span>
        </div>
      </div>
    </div>
  );
}
