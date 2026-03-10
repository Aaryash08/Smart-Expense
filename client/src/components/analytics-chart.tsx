import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useMonthlyAnalytics } from "@/hooks/use-expenses";
import { Loader2, PieChart as ChartIcon } from "lucide-react";

// Sophisticated, financial-friendly color palette
const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#64748b'];

export function AnalyticsChart() {
  const { data, isLoading, error } = useMonthlyAnalytics();

  if (isLoading) {
    return (
      <div className="h-[300px] w-full flex flex-col items-center justify-center text-muted-foreground bg-card rounded-2xl border border-border/50">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-destructive bg-red-50 rounded-2xl border border-red-100">
        <p>Failed to load analytics</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[300px] w-full flex flex-col items-center justify-center text-muted-foreground bg-card rounded-2xl border border-border/50 border-dashed">
        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
          <ChartIcon className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="font-medium text-foreground">No data yet</p>
        <p className="text-sm">Track expenses to see your breakdown.</p>
      </div>
    );
  }

  return (
    <div className="h-[350px] w-full bg-card rounded-2xl border border-border/50 shadow-sm p-6">
      <h3 className="text-lg font-bold font-display mb-4">Monthly Breakdown</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={70}
            outerRadius={95}
            paddingAngle={5}
            dataKey="total"
            nameKey="category"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Amount']}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: '12px', fontWeight: 500 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
