import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  amount: integer("amount").notNull(), // Stored as integer (e.g., cents or whole dollars, we'll assume dollars for simplicity here)
  category: text("category").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  userId: integer("user_id").notNull().references(() => users.id),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, userId: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type CreateExpenseRequest = InsertExpense;
export type CreateExpenseResponse = {
  expense: Expense;
  warning?: string;
};

export type MonthlyAnalyticsResponse = {
  category: string;
  total: number;
}[];
