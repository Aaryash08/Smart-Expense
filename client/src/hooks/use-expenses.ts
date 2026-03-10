import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { authFetch } from "./use-auth";
import { z } from "zod";

// Zod schemas for runtime parsing of the backend responses
const ExpenseSchema = api.expenses.list.responses[200].element;
const AnalyticsSchema = api.expenses.analytics.responses[200];

export function useExpenses() {
  return useQuery({
    queryKey: [api.expenses.list.path],
    queryFn: async () => {
      const res = await authFetch(api.expenses.list.path);
      if (!res.ok) throw new Error("Failed to fetch expenses");
      const data = await res.json();
      // Using Zod to strictly validate the response shape
      return z.array(ExpenseSchema).parse(data);
    },
  });
}

export function useMonthlyAnalytics() {
  return useQuery({
    queryKey: [api.expenses.analytics.path],
    queryFn: async () => {
      const res = await authFetch(api.expenses.analytics.path);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const data = await res.json();
      return AnalyticsSchema.parse(data);
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: z.infer<typeof api.expenses.create.input>) => {
      const validated = api.expenses.create.input.parse(input);
      const res = await authFetch(api.expenses.create.path, {
        method: "POST",
        body: JSON.stringify(validated),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Failed to create expense");
      }
      
      return api.expenses.create.responses[201].parse(data);
    },
    onSuccess: () => {
      // Invalidate both lists to trigger UI refresh
      queryClient.invalidateQueries({ queryKey: [api.expenses.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.expenses.analytics.path] });
    },
  });
}
