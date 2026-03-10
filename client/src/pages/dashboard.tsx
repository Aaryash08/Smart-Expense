import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { AddExpenseModal } from "@/components/expense-modal";
import { AnalyticsChart } from "@/components/analytics-chart";
import { useExpenses, useMonthlyAnalytics } from "@/hooks/use-expenses";
import { format } from "date-fns";
import { Loader2, TrendingDown, BellRing, Utensils, Home, Car, Film, ShoppingBag, Zap, CreditCard } from "lucide-react";
import { motion } from "framer-motion";

const CATEGORY_ICONS: Record<string, any> = {
  "Food & Dining": Utensils,
  "Rent & Housing": Home,
  "Transportation": Car,
  "Entertainment": Film,
  "Shopping": ShoppingBag,
  "Utilities": Zap,
  "Other": CreditCard
};

export default function Dashboard() {
  const { user } = useAuth();
  const { data: expenses, isLoading: expensesLoading } = useExpenses();
  const { data: analytics } = useMonthlyAnalytics();

  const totalSpent = analytics?.reduce((acc, curr) => acc + curr.total, 0) || 0;
  const isWarning = totalSpent > 15000;

  return (
    <Layout>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Here's what's happening with your money.
          </p>
        </div>
        <AddExpenseModal />
      </div>

      {/* Warning Banner (Triggered by Budget Alert constraint > ₹1000) */}
      {isWarning && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-start gap-3"
        >
          <div className="p-2 bg-destructive text-white rounded-lg shadow-sm">
            <BellRing className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-destructive">Budget Alert Exceeded</h3>
            <p className="text-sm text-destructive/80 mt-1">
              You have spent ₹{totalSpent.toFixed(2)} this month, exceeding your ₹15,000.00 recommended limit. Consider reviewing your recent expenses.
            </p>
          </div>
        </motion.div>
      )}

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-primary to-indigo-700 rounded-2xl p-6 shadow-lg shadow-primary/20 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
            <TrendingDown className="w-32 h-32" />
          </div>
          <p className="font-medium text-primary-foreground/80 mb-1">Total Spent (This Month)</p>
          <h2 className="text-4xl font-display font-bold tracking-tight">
            ₹{totalSpent.toFixed(2)}
          </h2>
        </div>
        
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 flex flex-col justify-center">
          <p className="font-medium text-muted-foreground mb-1">Budget Limit</p>
          <h2 className="text-3xl font-display font-bold text-foreground">
            ₹15,000.00
          </h2>
          <div className="mt-4 h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${isWarning ? 'bg-destructive' : 'bg-primary'}`} 
              style={{ width: `${Math.min((totalSpent / 15000) * 100, 100)}%` }} 
            />
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 flex flex-col justify-center">
          <p className="font-medium text-muted-foreground mb-1">Remaining</p>
          <h2 className={`text-3xl font-display font-bold ${isWarning ? 'text-destructive' : 'text-emerald-500'}`}>
            ₹{Math.max(15000 - totalSpent, 0).toFixed(2)}
          </h2>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Expenses List */}
        <div className="lg:col-span-2 bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border/50 flex justify-between items-center bg-gray-50/30">
            <h3 className="text-xl font-display font-bold">Recent Expenses</h3>
          </div>
          
          <div className="p-0 flex-1 overflow-auto">
            {expensesLoading ? (
              <div className="h-48 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : expenses?.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-muted-foreground">
                <p>No expenses logged yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border/50">
                {expenses?.slice().reverse().map((expense) => {
                  const Icon = CATEGORY_ICONS[expense.category] || CATEGORY_ICONS["Other"];
                  return (
                    <li key={expense.id} className="p-4 sm:px-6 hover:bg-muted/50 transition-colors flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{expense.title}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                            <span className="bg-secondary px-2 py-0.5 rounded-md font-medium text-xs">
                              {expense.category}
                            </span>
                            <span>•</span>
                            <span>{format(new Date(expense.date), 'MMM dd, yyyy')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg font-display text-foreground">
                          ₹{expense.amount.toFixed(2)}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Analytics Sidebar */}
        <div className="lg:col-span-1 space-y-8">
          <AnalyticsChart />
        </div>
      </div>
    </Layout>
  );
}
