import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.SESSION_SECRET || "fallback_secret_for_jwt";

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: { id: number; username: string };
    }
  }
}

// Authentication Middleware
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(401).json({ message: "Invalid token" });
    req.user = user as { id: number; username: string };
    next();
  });
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // --- Auth Routes ---
  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existingUser = await storage.getUserByUsername(input.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists", field: "username" });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);
      const user = await storage.createUser({ ...input, password: hashedPassword });
      
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "24h" });
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json({ token, user: userWithoutPassword });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      const user = await storage.getUserByUsername(input.username);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      const isMatch = await bcrypt.compare(input.password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "24h" });
      const { password, ...userWithoutPassword } = user;

      res.status(200).json({ token, user: userWithoutPassword });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // --- Expenses Routes (Protected) ---
  app.get(api.expenses.list.path, authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const expenses = await storage.getExpensesByUserId(userId);
      res.status(200).json(expenses);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.expenses.create.path, authenticateToken, async (req, res) => {
    try {
      const bodySchema = api.expenses.create.input.extend({
        amount: z.coerce.number()
      });
      const input = bodySchema.parse(req.body);
      const userId = req.user!.id;

      // Create the expense
      const newExpense = await storage.createExpense(userId, input);

      // Check monthly total for budget alert
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const monthlyExpenses = await storage.getMonthlyExpensesByUserId(userId, firstDay, lastDay);
      const totalMonthlySpending = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);

      let warning;
      if (totalMonthlySpending > 15000) {
        warning = "Warning: You have exceeded your ₹15000 monthly budget!";
      }

      res.status(201).json({ expense: newExpense, warning });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.expenses.analytics.path, authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const monthlyExpenses = await storage.getMonthlyExpensesByUserId(userId, firstDay, lastDay);
      
      // Group by category using reduce
      const analyticsMap = monthlyExpenses.reduce((acc: Record<string, number>, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
      }, {});

      const analyticsResponse = Object.entries(analyticsMap).map(([category, total]) => ({
        category,
        total
      }));

      res.status(200).json(analyticsResponse);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
