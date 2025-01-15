import { BarChart as LucideBarChart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPrice } from "@/utils/priceFormatters";

const STATUS_COLORS = {
  proposed: "#60A5FA", // blue-400
  confirmed: "#34D399", // emerald-400
  cancelled: "#F87171", // red-400
} as const;

type EventData = {
  month: string;
  proposed: number;
  confirmed: number;
  cancelled: number;
};

type SummaryData = {
  proposed: number;
  confirmed: number;
  cancelled: number;
};

export function RevenueChart() {
  const { data: revenueData, isLoading } = useQuery({
    queryKey: ['revenue-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('revenue_events')
        .select('date, total_price, status')
        .order('date');
      
      if (error) throw error;
      
      // Group data by month and status
      const monthlyData = (data || []).reduce((acc: Record<string, Record<string, number>>, event) => {
        const month = new Date(event.date).toLocaleString('default', { month: 'short' });
        if (!acc[month]) {
          acc[month] = {
            proposed: 0,
            confirmed: 0,
            cancelled: 0,
          };
        }
        acc[month][event.status] = (acc[month][event.status] || 0) + (event.total_price || 0);
        return acc;
      }, {});

      // Convert to chart format
      const chartData = Object.entries(monthlyData).map(([month, amounts]) => ({
        month,
        ...amounts
      }));

      // Calculate summary totals
      const summaryData = {
        proposed: (data || []).reduce((sum, event) => 
          event.status === 'proposed' ? sum + (event.total_price || 0) : sum, 0),
        confirmed: (data || []).reduce((sum, event) => 
          event.status === 'confirmed' ? sum + (event.total_price || 0) : sum, 0),
        cancelled: (data || []).reduce((sum, event) => 
          event.status === 'cancelled' ? sum + (event.total_price || 0) : sum, 0),
      };

      return { chartData, summaryData };
    }
  });

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  const { chartData, summaryData } = revenueData || { 
    chartData: [], 
    summaryData: { proposed: 0, confirmed: 0, cancelled: 0 } 
  };

  return (
    <div className="space-y-6">
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
            tickFormatter={(value) => formatPrice(value)}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '0.375rem'
            }}
            labelStyle={{ color: '#9CA3AF' }}
            itemStyle={{ color: '#E5E7EB' }}
            formatter={(value: number) => formatPrice(value)}
          />
          <Legend />
          <Bar 
            dataKey="proposed" 
            name="Proposed"
            fill={STATUS_COLORS.proposed}
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="confirmed" 
            name="Confirmed"
            fill={STATUS_COLORS.confirmed}
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="cancelled" 
            name="Cancelled"
            fill={STATUS_COLORS.cancelled}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Proposed</TableCell>
              <TableCell className="text-right">{formatPrice(summaryData.proposed)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Confirmed</TableCell>
              <TableCell className="text-right">{formatPrice(summaryData.confirmed)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Cancelled</TableCell>
              <TableCell className="text-right">{formatPrice(summaryData.cancelled)}</TableCell>
            </TableRow>
            <TableRow className="font-semibold">
              <TableCell>Total</TableCell>
              <TableCell className="text-right">
                {formatPrice(summaryData.proposed + summaryData.confirmed + summaryData.cancelled)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

RevenueChart.Icon = LucideBarChart;