import { useMemo } from "react";
import { BarChart as LucideBarChart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export function RevenueChart() {
  const { data: events, isLoading } = useQuery({
    queryKey: ['revenue-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_events')
        .select('date, total_price')
        .order('date');
      
      if (error) throw error;
      return data;
    }
  });

  const chartData = useMemo(() => {
    if (!events) return [];
    
    // Group events by month and sum total_price
    const monthlyData = events.reduce((acc: Record<string, number>, event) => {
      const month = new Date(event.date).toLocaleString('default', { month: 'short' });
      acc[month] = (acc[month] || 0) + (event.total_price || 0);
      return acc;
    }, {});

    return Object.entries(monthlyData).map(([month, amount]) => ({
      month,
      amount
    }));
  }, [events]);

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="month" 
          stroke="#9CA3AF"
          fontSize={12}
        />
        <YAxis 
          stroke="#9CA3AF"
          fontSize={12}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1F2937',
            border: '1px solid #374151',
            borderRadius: '0.375rem'
          }}
          labelStyle={{ color: '#9CA3AF' }}
          itemStyle={{ color: '#E5E7EB' }}
        />
        <Bar 
          dataKey="amount" 
          fill="#8B5CF6" 
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

RevenueChart.Icon = LucideBarChart;