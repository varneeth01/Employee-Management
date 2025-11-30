import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import mongoose, { Schema, Document } from "mongoose";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "employee" | "manager";
  employeeId: string;
  department: string;
  createdAt: string;
}

export interface Attendance {
  id: string;
  userId: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: "present" | "absent" | "late" | "half-day";
  totalHours: number | null;
  createdAt: string;
}

export interface InsertUser {
  name: string;
  email: string;
  password: string;
  role: "employee" | "manager";
  employeeId: string;
  department: string;
}

export interface InsertAttendance {
  userId: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: "present" | "absent" | "late" | "half-day";
  totalHours: number | null;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByEmployeeId(employeeId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllEmployees(): Promise<User[]>;

  getAttendance(id: string): Promise<Attendance | undefined>;
  getAttendanceByUserAndDate(userId: string, date: string): Promise<Attendance | undefined>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: string, updates: Partial<Attendance>): Promise<Attendance | undefined>;
  getAttendanceByUser(userId: string, month?: string): Promise<Attendance[]>;
  getAllAttendance(filters?: {
    employeeId?: string;
    date?: string;
    status?: string;
    from?: string;
    to?: string;
  }): Promise<Attendance[]>;
  getAttendanceByDate(date: string): Promise<Attendance[]>;
}

interface IUserDocument extends Document {
  _id: mongoose.Types.ObjectId;
  id: string;
  name: string;
  email: string;
  password: string;
  role: "employee" | "manager";
  employeeId: string;
  department: string;
  createdAt: Date;
}

interface IAttendanceDocument extends Document {
  _id: mongoose.Types.ObjectId;
  id: string;
  userId: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: "present" | "absent" | "late" | "half-day";
  totalHours: number | null;
  createdAt: Date;
}

const userSchema = new Schema<IUserDocument>({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["employee", "manager"], required: true },
  employeeId: { type: String, required: true, unique: true, index: true },
  department: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const attendanceSchema = new Schema<IAttendanceDocument>({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  date: { type: String, required: true, index: true },
  checkInTime: { type: String, default: null },
  checkOutTime: { type: String, default: null },
  status: { type: String, enum: ["present", "absent", "late", "half-day"], required: true },
  totalHours: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now },
});

attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

const UserModel = mongoose.model<IUserDocument>("User", userSchema);
const AttendanceModel = mongoose.model<IAttendanceDocument>("Attendance", attendanceSchema);

class MongoStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ id });
    return user ? this.convertUserDoc(user) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    return user ? this.convertUserDoc(user) : undefined;
  }

  async getUserByEmployeeId(employeeId: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ employeeId });
    return user ? this.convertUserDoc(user) : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user = new UserModel({
      id,
      ...insertUser,
      password: hashedPassword,
    });
    await user.save();
    return this.convertUserDoc(user);
  }

  async getAllEmployees(): Promise<User[]> {
    const users = await UserModel.find({ role: "employee" });
    return users.map((u) => this.convertUserDoc(u));
  }

  async getAttendance(id: string): Promise<Attendance | undefined> {
    const attendance = await AttendanceModel.findOne({ id });
    return attendance ? this.convertAttendanceDoc(attendance) : undefined;
  }

  async getAttendanceByUserAndDate(
    userId: string,
    date: string
  ): Promise<Attendance | undefined> {
    const attendance = await AttendanceModel.findOne({ userId, date });
    return attendance ? this.convertAttendanceDoc(attendance) : undefined;
  }

  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const id = randomUUID();
    const attendance = new AttendanceModel({
      id,
      ...insertAttendance,
    });
    await attendance.save();
    return this.convertAttendanceDoc(attendance);
  }

  async updateAttendance(
    id: string,
    updates: Partial<Attendance>
  ): Promise<Attendance | undefined> {
    const attendance = await AttendanceModel.findOneAndUpdate(
      { id },
      updates,
      { new: true }
    );
    return attendance ? this.convertAttendanceDoc(attendance) : undefined;
  }

  async getAttendanceByUser(userId: string, month?: string): Promise<Attendance[]> {
    let query: Record<string, any> = { userId };
    if (month) {
      query.date = { $regex: `^${month}` };
    }
    const records = await AttendanceModel.find(query).sort({ date: -1 });
    return records.map((r) => this.convertAttendanceDoc(r));
  }

  async getAllAttendance(filters?: {
    employeeId?: string;
    date?: string;
    status?: string;
    from?: string;
    to?: string;
  }): Promise<Attendance[]> {
    const query: Record<string, any> = {};

    if (filters?.employeeId) {
      query.userId = filters.employeeId;
    }
    if (filters?.date) {
      query.date = filters.date;
    }
    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.from || filters?.to) {
      query.date = {};
      if (filters?.from) {
        query.date.$gte = filters.from;
      }
      if (filters?.to) {
        query.date.$lte = filters.to;
      }
    }

    const records = await AttendanceModel.find(query).sort({ date: -1 });
    return records.map((r) => this.convertAttendanceDoc(r));
  }

  async getAttendanceByDate(date: string): Promise<Attendance[]> {
    const records = await AttendanceModel.find({ date });
    return records.map((r) => this.convertAttendanceDoc(r));
  }

  private convertUserDoc(doc: IUserDocument): User {
    return {
      id: doc.id,
      name: doc.name,
      email: doc.email,
      password: doc.password,
      role: doc.role,
      employeeId: doc.employeeId,
      department: doc.department,
      createdAt: doc.createdAt.toISOString(),
    };
  }

  private convertAttendanceDoc(doc: IAttendanceDocument): Attendance {
    return {
      id: doc.id,
      userId: doc.userId,
      date: doc.date,
      checkInTime: doc.checkInTime,
      checkOutTime: doc.checkOutTime,
      status: doc.status,
      totalHours: doc.totalHours,
      createdAt: doc.createdAt.toISOString(),
    };
  }
}

class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private attendance: Map<string, Attendance> = new Map();

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async getUserByEmployeeId(employeeId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.employeeId === employeeId
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user: User = {
      ...insertUser,
      id,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };
    this.users.set(id, user);
    return user;
  }

  async getAllEmployees(): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.role === "employee"
    );
  }

  async getAttendance(id: string): Promise<Attendance | undefined> {
    return this.attendance.get(id);
  }

  async getAttendanceByUserAndDate(
    userId: string,
    date: string
  ): Promise<Attendance | undefined> {
    return Array.from(this.attendance.values()).find(
      (a) => a.userId === userId && a.date === date
    );
  }

  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const id = randomUUID();
    const attendance: Attendance = {
      ...insertAttendance,
      id,
      createdAt: new Date().toISOString(),
    };
    this.attendance.set(id, attendance);
    return attendance;
  }

  async updateAttendance(
    id: string,
    updates: Partial<Attendance>
  ): Promise<Attendance | undefined> {
    const existing = this.attendance.get(id);
    if (!existing) return undefined;

    const updated: Attendance = { ...existing, ...updates };
    this.attendance.set(id, updated);
    return updated;
  }

  async getAttendanceByUser(userId: string, month?: string): Promise<Attendance[]> {
    let records = Array.from(this.attendance.values()).filter(
      (a) => a.userId === userId
    );

    if (month) {
      records = records.filter((a) => a.date.startsWith(month));
    }

    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getAllAttendance(filters?: {
    employeeId?: string;
    date?: string;
    status?: string;
    from?: string;
    to?: string;
  }): Promise<Attendance[]> {
    let records = Array.from(this.attendance.values());

    if (filters?.employeeId) {
      records = records.filter((a) => a.userId === filters.employeeId);
    }

    if (filters?.date) {
      records = records.filter((a) => a.date === filters.date);
    }

    if (filters?.status) {
      records = records.filter((a) => a.status === filters.status);
    }

    if (filters?.from) {
      records = records.filter((a) => a.date >= filters.from!);
    }

    if (filters?.to) {
      records = records.filter((a) => a.date <= filters.to!);
    }

    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getAttendanceByDate(date: string): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter((a) => a.date === date);
  }
}

async function initializeStorage(): Promise<IStorage> {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.warn(
      "MONGODB_URI not set, falling back to in-memory storage. Data will not persist."
    );
    return new MemStorage();
  }

  try {
    await mongoose.connect(mongoUri, {
      retryWrites: true,
      w: "majority",
    });
    console.log("Connected to MongoDB");
    return new MongoStorage();
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    console.warn("Falling back to in-memory storage");
    return new MemStorage();
  }
}

export let storage: IStorage;
let storageReady: Promise<void>;

async function seedData() {
  // Check if manager already exists to avoid duplicate seed data
  const existingManager = await storage.getUserByEmail("manager@example.com");
  if (existingManager) {
    console.log("Seed data already exists, skipping...");
    return;
  }

  const now = new Date();
  const today = now.toISOString().split("T")[0];

  try {
    const manager = await storage.createUser({
      name: "Sarah Wilson",
      email: "manager@example.com",
      password: "password123",
      role: "manager",
      employeeId: "MGR001",
      department: "HR",
    });

    const employee1 = await storage.createUser({
      name: "John Smith",
      email: "employee1@example.com",
      password: "password123",
      role: "employee",
      employeeId: "EMP001",
      department: "Engineering",
    });

    const employee2 = await storage.createUser({
      name: "Emily Johnson",
      email: "employee2@example.com",
      password: "password123",
      role: "employee",
      employeeId: "EMP002",
      department: "Sales",
    });

    const employee3 = await storage.createUser({
      name: "Michael Brown",
      email: "employee3@example.com",
      password: "password123",
      role: "employee",
      employeeId: "EMP003",
      department: "Support",
    });

    const employee4 = await storage.createUser({
      name: "Jessica Davis",
      email: "employee4@example.com",
      password: "password123",
      role: "employee",
      employeeId: "EMP004",
      department: "Engineering",
    });

    const employee5 = await storage.createUser({
      name: "David Martinez",
      email: "employee5@example.com",
      password: "password123",
      role: "employee",
      employeeId: "EMP005",
      department: "Marketing",
    });

    const employees = [employee1, employee2, employee3, employee4, employee5];

  for (let i = 1; i <= 14; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const dateStr = date.toISOString().split("T")[0];

    for (const emp of employees) {
      const rand = Math.random();

      if (rand < 0.1) continue;

      const checkInHour = rand < 0.3 ? 9 + Math.floor(Math.random() * 2) : 8 + Math.floor(Math.random() * 2);
      const checkInMinute = Math.floor(Math.random() * 60);
      const checkIn = new Date(date);
      checkIn.setHours(checkInHour, checkInMinute, 0, 0);

      const workedHours = 4 + Math.random() * 5;
      const checkOut = new Date(checkIn.getTime() + workedHours * 60 * 60 * 1000);

      let status: "present" | "late" | "half-day" = "present";
      if (checkInHour > 9 || (checkInHour === 9 && checkInMinute > 15)) {
        status = "late";
      }
      if (workedHours < 4) {
        status = "half-day";
      }

      await storage.createAttendance({
        userId: emp.id,
        date: dateStr,
        checkInTime: checkIn.toISOString(),
        checkOutTime: checkOut.toISOString(),
        status,
        totalHours: Math.round(workedHours * 10) / 10,
      });
    }
  }

    console.log("Seed data created successfully!");
  } catch (error: any) {
    // If seed data already exists, silently continue
    if (error?.code === 11000) {
      console.log("Seed data already exists in database");
      return;
    }
    throw error;
  }
}

async function init() {
  storage = await initializeStorage();
  await seedData();
}

storageReady = init().catch(error => {
  console.error("Failed to initialize storage:", error);
  process.exit(1);
});

export async function ensureStorageReady() {
  await storageReady;
}
