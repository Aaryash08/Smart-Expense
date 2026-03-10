import { z } from "zod";
import { insertExpenseSchema, insertUserSchema, expenses, users } from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/auth/register' as const,
      input: insertUserSchema,
      responses: {
        201: z.object({ token: z.string(), user: z.custom<Omit<typeof users.$inferSelect, "password">>() }),
        400: errorSchemas.validation,
      }
    },
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: insertUserSchema,
      responses: {
        200: z.object({ token: z.string(), user: z.custom<Omit<typeof users.$inferSelect, "password">>() }),
        401: errorSchemas.unauthorized,
      }
    }
  },
  expenses: {
    list: {
      method: 'GET' as const,
      path: '/api/expenses' as const,
      responses: {
        200: z.array(z.custom<typeof expenses.$inferSelect>()),
        401: errorSchemas.unauthorized,
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/expenses' as const,
      input: insertExpenseSchema,
      responses: {
        201: z.object({
          expense: z.custom<typeof expenses.$inferSelect>(),
          warning: z.string().optional()
        }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      }
    },
    analytics: {
      method: 'GET' as const,
      path: '/api/analytics/monthly' as const,
      responses: {
        200: z.array(z.object({
          category: z.string(),
          total: z.number()
        })),
        401: errorSchemas.unauthorized,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type AuthResponse = z.infer<typeof api.auth.login.responses[200]>;
export type ExpenseCreateResponse = z.infer<typeof api.expenses.create.responses[201]>;
export type MonthlyAnalyticsData = z.infer<typeof api.expenses.analytics.responses[200]>;
