import { z } from "zod";

export const UserRole = {
  EMPLOYEE: "employee",
  MANAGER: "manager",
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

export const AttendanceStatus = {
  PRESENT: "present",
  ABSENT: "absent",
  LATE: "late",
  HALF_DAY: "half-day",
} as const;

export type AttendanceStatusType = (typeof AttendanceStatus)[keyof typeof AttendanceStatus];

export const userSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum([UserRole.EMPLOYEE, UserRole.MANAGER]),
  employeeId: z.string().min(1, "Employee ID is required"),
  department: z.string().min(1, "Department is required"),
  createdAt: z.string(),
});

export const insertUserSchema = userSchema.omit({ id: true, createdAt: true });
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;

export const attendanceSchema = z.object({
  id: z.string(),
  userId: z.string(),
  date: z.string(),
  checkInTime: z.string().nullable(),
  checkOutTime: z.string().nullable(),
  status: z.enum([AttendanceStatus.PRESENT, AttendanceStatus.ABSENT, AttendanceStatus.LATE, AttendanceStatus.HALF_DAY]),
  totalHours: z.number().nullable(),
  createdAt: z.string(),
});

export const insertAttendanceSchema = attendanceSchema.omit({ id: true, createdAt: true });

export type Attendance = z.infer<typeof attendanceSchema>;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

export interface AuthResponse {
  user: Omit<User, "password">;
  token: string;
}

export interface EmployeeDashboardStats {
  todayStatus: {
    checkedIn: boolean;
    checkedOut: boolean;
    checkInTime: string | null;
    checkOutTime: string | null;
    status: AttendanceStatusType | null;
  };
  monthStats: {
    present: number;
    absent: number;
    late: number;
    halfDay: number;
  };
  totalHoursThisMonth: number;
  recentAttendance: (Attendance & { userName?: string })[];
}

export interface ManagerDashboardStats {
  totalEmployees: number;
  today: {
    present: number;
    absent: number;
    late: number;
  };
  lateToday: (User & { checkInTime: string })[];
  absentToday: Omit<User, "password">[];
  weeklyTrend: {
    date: string;
    present: number;
    absent: number;
    late: number;
  }[];
  departmentWise: {
    department: string;
    present: number;
    total: number;
    percentage: number;
  }[];
}

export interface AttendanceFilters {
  employeeId?: string;
  date?: string;
  status?: AttendanceStatusType;
  from?: string;
  to?: string;
}

export interface AttendanceWithUser extends Attendance {
  user?: Omit<User, "password">;
}

export interface MonthlySummary {
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  totalHours: number;
  workingDays: number;
}
