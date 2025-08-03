import { BarChart as LucideBarChart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPrice } from "@/utils/priceFormatters";

const STATUS_COLORS = {
  proposed: "#3B82F6", // blue-500
  confirmed: "#10B981", // emerald-500
  cancelled: "#EF4444", // red-500
} as const;

const STATUS_GRADIENTS = {
  proposed: "linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)",
  confirmed: "linear-gradient(135deg, #34D399 0%, #10B981 100%)",
  cancelled: "linear-gradient(135deg, #F87171 0%, #EF4444 100%)",
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

interface RevenueChartProps {
  ownerId?: string;
}

export function RevenueChart({ ownerId }: RevenueChartProps) {
  const { data: revenueData, isLoading } = useQuery({
    queryKey: ['revenue-events', ownerId],
    queryFn: async () => {
      console.log('Fetching revenue data for owner:', ownerId);
      
      // First get project IDs for the owner if ownerId is provided
      let projectIds: string[] = [];
      if (ownerId) {
        const { data: projects, error: projectError } = await supabase
          .from('projects')
          .select('id')
          .eq('owner_id', ownerId);

        if (projectError) {
          console.error('Error fetching projects:', projectError);
          throw projectError;
        }

        projectIds = (projects || []).map(p => p.id);
        console.log('Found project IDs:', projectIds);
        
        if (projectIds.length === 0) {
          return { 
            chartData: [], 
            summaryData: { proposed: 0, confirmed: 0, cancelled: 0 } 
          };
        }
      }

      // Then get events filtered by those project IDs if needed
      let query = supabase
        .from('project_events')
        .select(`
          date,
          total_price,
          status
        `);

      if (ownerId && projectIds.length > 0) {
        query = query.in('project_id', projectIds);
      }
      
      const { data, error } = await query.order('date');
      
      if (error) {
        console.error('Error fetching events:', error);
        throw error;
      }

      console.log('Fetched events:', data);
      
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

      // Convert to chart format with explicit typing
      const chartData: EventData[] = Object.entries(monthlyData).map(([month, amounts]) => ({
        month,
        proposed: amounts.proposed || 0,
        confirmed: amounts.confirmed || 0,
        cancelled: amounts.cancelled || 0
      }));

      // Calculate summary totals
      const summaryData: SummaryData = {
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

  // Calculate the maximum value for the chart
  const maxValue = Math.max(
    ...chartData.map(data => 
      Math.max(data.proposed || 0, data.confirmed || 0, data.cancelled || 0)
    )
  );

  // Add 20% padding to the top
  const yAxisDomain = [0, maxValue * 1.2];

  return (
    <div className="space-y-6">
      {/* Summary Cards Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50/10 to-blue-100/10 border border-blue-200/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <div>
              <p className="text-xs font-medium text-blue-400 uppercase tracking-wide">Proposed</p>
              <p className="text-xl font-bold text-blue-500">{formatPrice(summaryData?.proposed || 0)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-50/10 to-emerald-100/10 border border-emerald-200/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <div>
              <p className="text-xs font-medium text-emerald-400 uppercase tracking-wide">Confirmed</p>
              <p className="text-xl font-bold text-emerald-500">{formatPrice(summaryData?.confirmed || 0)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-red-50/10 to-red-100/10 border border-red-200/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div>
              <p className="text-xs font-medium text-red-400 uppercase tracking-wide">Cancelled</p>
              <p className="text-xl font-bold text-red-500">{formatPrice(summaryData?.cancelled || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Chart */}
      <div className="h-[320px] pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            barCategoryGap="20%"
          >
            {/* Enhanced Grid */}
            <CartesianGrid strokeDasharray="2 4" stroke="#374151" opacity={0.3} />
            
            {/* Styled Axes */}
            <XAxis 
              dataKey="month" 
              stroke="#9CA3AF"
              fontSize={13}
              fontWeight={500}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF' }}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              tickFormatter={(value) => value >= 1000000 ? `${(value/1000000).toFixed(0)}M kr` : value >= 1000 ? `${(value/1000).toFixed(0)}k kr` : formatPrice(value)}
              domain={yAxisDomain}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF' }}
            />
            
            {/* Enhanced Tooltip */}
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#111827',
                border: '1px solid #374151',
                borderRadius: '0.5rem',
                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
              }}
              labelStyle={{ color: '#F3F4F6', fontWeight: '600' }}
              cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
              formatter={(value: number, name: string) => [
                formatPrice(value),
                name
              ]}
            />
            
            {/* Enhanced Legend */}
            <Legend 
              iconType="circle"
              wrapperStyle={{ paddingTop: '20px' }}
            />
            
            {/* Enhanced Bars with Gradients */}
            <Bar 
              dataKey="proposed" 
              name="Proposed"
              fill={STATUS_COLORS.proposed}
              radius={[6, 6, 0, 0]}
              stroke="rgba(59, 130, 246, 0.3)"
              strokeWidth={1}
            />
            <Bar 
              dataKey="confirmed" 
              name="Confirmed"
              fill={STATUS_COLORS.confirmed}
              radius={[6, 6, 0, 0]}
              stroke="rgba(16, 185, 129, 0.3)"
              strokeWidth={1}
            />
            <Bar 
              dataKey="cancelled" 
              name="Cancelled"
              fill={STATUS_COLORS.cancelled}
              radius={[6, 6, 0, 0]}
              stroke="rgba(239, 68, 68, 0.3)"
              strokeWidth={1}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

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