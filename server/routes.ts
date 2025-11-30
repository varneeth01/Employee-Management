import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage, type User, ensureStorageReady } from "./storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || "attendance-system-secret-key";

interface AuthRequest extends Request {
  user?: { id: string; role: "employee" | "manager" };
}

function generateToken(user: User): string {
  return jwt.sign(
    { id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function sanitizeUser(user: User): Omit<User, "password"> {
  const { password, ...sanitized } = user;
  return sanitized;
}

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: "employee" | "manager" };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function requireRole(role: "employee" | "manager") {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
}

function getStartOfDay(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}

function getMonthDates(yearMonth: string): { start: string; end: string } {
  const [year, month] = yearMonth.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

function getWorkingDaysInMonth(yearMonth: string): number {
  const [year, month] = yearMonth.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  let count = 0;
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
  }
  
  return count;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await ensureStorageReady();

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { name, email, password, role, employeeId, department } = req.body;

      if (!name || !email || !password || !role || !employeeId || !department) {
        return res.status(400).json({ message: "All fields are required" });
      }

      if (role !== "employee" && role !== "manager") {
        return res.status(400).json({ message: "Role must be 'employee' or 'manager'" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const existingEmpId = await storage.getUserByEmployeeId(employeeId);
      if (existingEmpId) {
        return res.status(400).json({ message: "Employee ID already exists" });
      }

      const user = await storage.createUser({
        name,
        email,
        password,
        role,
        employeeId,
        department,
      });

      const token = generateToken(user);

      res.status(201).json({
        user: sanitizeUser(user),
        token,
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateToken(user);

      res.json({
        user: sanitizeUser(user),
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/auth/me", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(sanitizeUser(user));
    } catch (error) {
      res.status(500).json({ message: "Failed to get user info" });
    }
  });

  app.get("/api/users/employees", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const employees = await storage.getAllEmployees();
      res.json(employees.map(sanitizeUser));
    } catch (error) {
      res.status(500).json({ message: "Failed to get employees" });
    }
  });

  app.post("/api/attendance/checkin", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const today = getStartOfDay();
      const now = new Date();

      const existing = await storage.getAttendanceByUserAndDate(userId, today);
      if (existing) {
        return res.status(400).json({ message: "Already checked in today" });
      }

      const hour = now.getHours();
      const minute = now.getMinutes();
      const status: "present" | "late" = hour > 9 || (hour === 9 && minute > 15) ? "late" : "present";

      const attendance = await storage.createAttendance({
        userId,
        date: today,
        checkInTime: now.toISOString(),
        checkOutTime: null,
        status,
        totalHours: null,
      });

      res.status(201).json(attendance);
    } catch (error) {
      console.error("Check-in error:", error);
      res.status(500).json({ message: "Check-in failed" });
    }
  });

  app.post("/api/attendance/checkout", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const today = getStartOfDay();
      const now = new Date();

      const attendance = await storage.getAttendanceByUserAndDate(userId, today);
      if (!attendance) {
        return res.status(400).json({ message: "No check-in record found for today" });
      }

      if (attendance.checkOutTime) {
        return res.status(400).json({ message: "Already checked out today" });
      }

      const checkInTime = new Date(attendance.checkInTime!);
      const totalHours = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      
      let status = attendance.status;
      if (totalHours < 4) {
        status = "half-day";
      }

      const updated = await storage.updateAttendance(attendance.id, {
        checkOutTime: now.toISOString(),
        totalHours: Math.round(totalHours * 10) / 10,
        status,
      });

      res.json(updated);
    } catch (error) {
      console.error("Check-out error:", error);
      res.status(500).json({ message: "Check-out failed" });
    }
  });

  app.get("/api/attendance/today", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const today = getStartOfDay();

      const attendance = await storage.getAttendanceByUserAndDate(userId, today);
      res.json(attendance || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to get today's attendance" });
    }
  });

  app.get("/api/attendance/my-history", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const month = req.query.month as string | undefined;

      const records = await storage.getAttendanceByUser(userId, month);
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to get attendance history" });
    }
  });

  app.get("/api/attendance/my-summary", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const month = (req.query.month as string) || getStartOfDay().substring(0, 7);

      const records = await storage.getAttendanceByUser(userId, month);
      
      let present = 0, absent = 0, late = 0, halfDay = 0, totalHours = 0;
      
      records.forEach((r) => {
        if (r.status === "present") present++;
        else if (r.status === "late") late++;
        else if (r.status === "half-day") halfDay++;
        if (r.totalHours) totalHours += r.totalHours;
      });

      const workingDays = getWorkingDaysInMonth(month);
      const today = new Date();
      const currentMonth = getStartOfDay().substring(0, 7);
      
      let daysToCount = workingDays;
      if (month === currentMonth) {
        const [year, mon] = month.split("-").map(Number);
        daysToCount = 0;
        for (let d = 1; d <= today.getDate(); d++) {
          const date = new Date(year, mon - 1, d);
          if (date.getDay() !== 0 && date.getDay() !== 6) daysToCount++;
        }
      }

      absent = Math.max(0, daysToCount - (present + late + halfDay));

      res.json({
        present,
        absent,
        late,
        halfDay,
        totalHours: Math.round(totalHours * 10) / 10,
        workingDays: daysToCount,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get summary" });
    }
  });

  app.get("/api/attendance/all", authMiddleware, requireRole("manager"), async (req: AuthRequest, res: Response) => {
    try {
      const { employeeId, date, status, from, to } = req.query as Record<string, string>;

      const records = await storage.getAllAttendance({
        employeeId: employeeId && employeeId !== "all" ? employeeId : undefined,
        date,
        status: status && status !== "all" ? status : undefined,
        from,
        to,
      });

      const employees = await storage.getAllEmployees();
      const employeeMap = new Map(employees.map((e) => [e.id, sanitizeUser(e)]));

      const recordsWithUsers = records.map((r) => ({
        ...r,
        user: employeeMap.get(r.userId),
      }));

      res.json(recordsWithUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get attendance records" });
    }
  });

  app.get("/api/attendance/employee/:id", authMiddleware, requireRole("manager"), async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const month = req.query.month as string | undefined;

      const records = await storage.getAttendanceByUser(id, month);
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to get employee attendance" });
    }
  });

  app.get("/api/attendance/summary", authMiddleware, requireRole("manager"), async (req: AuthRequest, res: Response) => {
    try {
      const employees = await storage.getAllEmployees();
      const month = (req.query.month as string) || getStartOfDay().substring(0, 7);
      
      let totalPresent = 0, totalLate = 0, totalAbsent = 0, totalHalfDay = 0;

      for (const emp of employees) {
        const records = await storage.getAttendanceByUser(emp.id, month);
        records.forEach((r) => {
          if (r.status === "present") totalPresent++;
          else if (r.status === "late") totalLate++;
          else if (r.status === "half-day") totalHalfDay++;
        });
      }

      res.json({
        totalEmployees: employees.length,
        present: totalPresent,
        late: totalLate,
        halfDay: totalHalfDay,
        absent: totalAbsent,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get summary" });
    }
  });

  app.get("/api/attendance/today-status", authMiddleware, requireRole("manager"), async (req: AuthRequest, res: Response) => {
    try {
      const date = (req.query.date as string) || getStartOfDay();
      const records = await storage.getAttendanceByDate(date);
      
      const employees = await storage.getAllEmployees();
      const employeeMap = new Map(employees.map((e) => [e.id, sanitizeUser(e)]));

      const recordsWithUsers = records.map((r) => ({
        ...r,
        user: employeeMap.get(r.userId),
      }));

      res.json(recordsWithUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get today's status" });
    }
  });

  app.get("/api/attendance/export", authMiddleware, requireRole("manager"), async (req: AuthRequest, res: Response) => {
    try {
      const { employeeId, from, to } = req.query as Record<string, string>;

      const records = await storage.getAllAttendance({
        employeeId: employeeId && employeeId !== "all" ? employeeId : undefined,
        from,
        to,
      });

      const employees = await storage.getAllEmployees();
      const employeeMap = new Map(employees.map((e) => [e.id, e]));

      const csvHeader = "Employee ID,Name,Department,Date,Check In,Check Out,Status,Hours Worked\n";
      const csvRows = records.map((r) => {
        const emp = employeeMap.get(r.userId);
        return [
          emp?.employeeId || "",
          emp?.name || "",
          emp?.department || "",
          r.date,
          r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString() : "",
          r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString() : "",
          r.status,
          r.totalHours?.toFixed(1) || "",
        ].join(",");
      }).join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="attendance-report-${new Date().toISOString().split("T")[0]}.csv"`);
      res.send(csvHeader + csvRows);
    } catch (error) {
      res.status(500).json({ message: "Failed to export attendance" });
    }
  });

  app.get("/api/dashboard/employee", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const today = getStartOfDay();
      const currentMonth = today.substring(0, 7);

      const todayAttendance = await storage.getAttendanceByUserAndDate(userId, today);
      const monthRecords = await storage.getAttendanceByUser(userId, currentMonth);

      let present = 0, late = 0, halfDay = 0, totalHours = 0;
      monthRecords.forEach((r) => {
        if (r.status === "present") present++;
        else if (r.status === "late") late++;
        else if (r.status === "half-day") halfDay++;
        if (r.totalHours) totalHours += r.totalHours;
      });

      const workingDays = getWorkingDaysInMonth(currentMonth);
      const todayDate = new Date();
      const [year, mon] = currentMonth.split("-").map(Number);
      let daysToCount = 0;
      for (let d = 1; d <= todayDate.getDate(); d++) {
        const date = new Date(year, mon - 1, d);
        if (date.getDay() !== 0 && date.getDay() !== 6) daysToCount++;
      }
      const absent = Math.max(0, daysToCount - (present + late + halfDay));

      const last7Days: Date[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7Days.push(d);
      }

      const recentAttendance = await Promise.all(
        last7Days.map(async (d) => {
          const dateStr = d.toISOString().split("T")[0];
          return storage.getAttendanceByUserAndDate(userId, dateStr);
        })
      );

      res.json({
        todayStatus: {
          checkedIn: !!todayAttendance?.checkInTime,
          checkedOut: !!todayAttendance?.checkOutTime,
          checkInTime: todayAttendance?.checkInTime || null,
          checkOutTime: todayAttendance?.checkOutTime || null,
          status: todayAttendance?.status || null,
        },
        monthStats: {
          present,
          absent,
          late,
          halfDay,
        },
        totalHoursThisMonth: Math.round(totalHours * 10) / 10,
        recentAttendance: recentAttendance.filter(Boolean),
      });
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ message: "Failed to get dashboard data" });
    }
  });

  app.get("/api/dashboard/manager", authMiddleware, requireRole("manager"), async (req: AuthRequest, res: Response) => {
    try {
      const today = getStartOfDay();
      const currentMonth = today.substring(0, 7);

      const employees = await storage.getAllEmployees();
      const todayRecords = await storage.getAttendanceByDate(today);

      const presentToday = todayRecords.filter((r) => r.status === "present" || r.status === "late" || r.status === "half-day").length;
      const lateToday = todayRecords.filter((r) => r.status === "late");
      const absentToday = employees.filter(
        (e) => !todayRecords.some((r) => r.userId === e.id)
      );

      const last7Days: { date: string; present: number; absent: number; late: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const dayRecords = await storage.getAttendanceByDate(dateStr);
        
        last7Days.push({
          date: dateStr,
          present: dayRecords.filter((r) => r.status === "present").length,
          late: dayRecords.filter((r) => r.status === "late").length,
          absent: employees.length - dayRecords.length,
        });
      }

      const departments = [...new Set(employees.map((e) => e.department))];
      const departmentWise = await Promise.all(
        departments.map(async (dept) => {
          const deptEmployees = employees.filter((e) => e.department === dept);
          const monthRecords = await storage.getAllAttendance({
            from: `${currentMonth}-01`,
            to: today,
          });
          
          const deptRecords = monthRecords.filter((r) =>
            deptEmployees.some((e) => e.id === r.userId)
          );
          
          const presentCount = deptRecords.filter(
            (r) => r.status === "present" || r.status === "late"
          ).length;

          const workingDays = getWorkingDaysInMonth(currentMonth);
          const todayDate = new Date();
          const [year, mon] = currentMonth.split("-").map(Number);
          let daysToCount = 0;
          for (let d = 1; d <= todayDate.getDate(); d++) {
            const date = new Date(year, mon - 1, d);
            if (date.getDay() !== 0 && date.getDay() !== 6) daysToCount++;
          }
          
          const totalPossible = deptEmployees.length * daysToCount;
          const percentage = totalPossible > 0 ? (presentCount / totalPossible) * 100 : 0;

          return {
            department: dept,
            present: presentCount,
            total: deptEmployees.length,
            percentage: Math.round(percentage * 10) / 10,
          };
        })
      );

      const lateWithTime = lateToday.map((r) => {
        const emp = employees.find((e) => e.id === r.userId);
        return emp ? { ...sanitizeUser(emp), checkInTime: r.checkInTime! } : null;
      }).filter(Boolean);

      res.json({
        totalEmployees: employees.length,
        today: {
          present: presentToday,
          absent: absentToday.length,
          late: lateToday.length,
        },
        lateToday: lateWithTime,
        absentToday: absentToday.map(sanitizeUser),
        weeklyTrend: last7Days,
        departmentWise,
      });
    } catch (error) {
      console.error("Manager dashboard error:", error);
      res.status(500).json({ message: "Failed to get dashboard data" });
    }
  });

  return httpServer;
}
