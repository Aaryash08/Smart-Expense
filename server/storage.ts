import { db } from "./db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { 
  users, expenses, 
  type User, type InsertUser, 
  type Expense, type InsertExpense 
} from "@shared/schema";

export interface IStorage {
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createExpense(userId: number, expense: InsertExpense): Promise<Expense>;
  getExpensesByUserId(userId: number): Promise<Expense[]>;
  getMonthlyExpensesByUserId(userId: number, startDate: Date, endDate: Date): Promise<Expense[]>;
}

export class DatabaseStorage implements IStorage {
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createExpense(userId: number, expense: InsertExpense): Promise<Expense> {
    const [newExpense] = await db
      .insert(expenses)
      .values({ ...expense, userId })
      .returning();
    return newExpense;
  }

  async getExpensesByUserId(userId: number): Promise<Expense[]> {
    return await db.select().from(expenses).where(eq(expenses.userId, userId)).orderBy(sql`${expenses.date} DESC`);
  }

  async getMonthlyExpensesByUserId(userId: number, startDate: Date, endDate: Date): Promise<Expense[]> {
    return await db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, userId),
          gte(expenses.date, startDate),
          lte(expenses.date, endDate)
        )
      );
  }
}

export const storage = new DatabaseStorage();
