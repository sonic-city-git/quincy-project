import { useState } from "react";
import { BarChart as LucideBarChart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

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
  fullMonthYear?: string;
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
  const [hoveredData, setHoveredData] = useState<EventData | null>(null);
  const [hoveredMonthYear, setHoveredMonthYear] = useState<string | null>(null);

  const { data: revenueData, isLoading } = useQuery({
    queryKey: ['revenue-events', ownerId],
    queryFn: async () => {
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

      // Initialize all 12 months of the current year using consistent month keys
      const currentYear = new Date().getFullYear();
      const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // Create initial monthly data with all months
      const monthlyData = monthOrder.reduce((acc, monthKey, index) => {
        const date = new Date(currentYear, index, 1);
        const fullMonthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        acc[monthKey] = {
          proposed: 0,
          confirmed: 0,
          cancelled: 0,
          fullMonthYear: fullMonthYear
        };
        return acc;
      }, {} as Record<string, {proposed: number, confirmed: number, cancelled: number, fullMonthYear: string}>);

      // Populate with actual event data
      (data || []).forEach(event => {
        const eventDate = new Date(event.date);
        const monthKey = eventDate.toLocaleString('default', { month: 'short' });
        
        if (monthlyData[monthKey]) {
          const status = event.status;
          if (status === 'proposed' || status === 'confirmed' || status === 'cancelled') {
            monthlyData[monthKey][status] = (monthlyData[monthKey][status] || 0) + (event.total_price || 0);
          }
        }
      });

      // Convert to chart format with explicit typing - maintain month order
      const chartData: EventData[] = monthOrder.map(month => {
        const monthData = monthlyData[month];
        return {
          month,
          fullMonthYear: monthData.fullMonthYear,
          proposed: monthData.proposed || 0,
          confirmed: monthData.confirmed || 0,
          cancelled: monthData.cancelled || 0
        };
      });

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

  if (!revenueData) {
    return <div className="h-[400px] w-full flex items-center justify-center text-muted-foreground">Failed to load revenue data</div>;
  }

  const { chartData, summaryData } = revenueData;

  // Calculate the maximum value for the chart
  const maxValue = chartData.length > 0 ? Math.max(
    ...chartData.map(data => 
      Math.max(data.proposed || 0, data.confirmed || 0, data.cancelled || 0)
    )
  ) : 100; // Default minimum value

  // Add 20% padding to the top  
  const yAxisDomain = [0, Math.max(maxValue * 1.2, 100)];

  // Use hovered data if available, otherwise use summary data
  const displayData = hoveredData || summaryData;
  const isShowingHovered = !!hoveredData;

  return (
    <div className="space-y-6">
      {/* Dynamic Summary Cards Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className={`bg-gradient-to-br from-blue-50/10 to-blue-100/10 border border-blue-200/20 rounded-lg p-4 transition-all duration-200 ${isShowingHovered ? 'ring-2 ring-blue-500/20' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <div>
              <p className="text-xs font-medium text-blue-400 uppercase tracking-wide">Proposed</p>
              <p className="text-xs text-muted-foreground">
                {isShowingHovered ? hoveredMonthYear : 'Total Revenue'}
              </p>
              <p className="text-xl font-bold text-blue-500">{formatPrice(displayData?.proposed || 0)}</p>
            </div>
          </div>
        </div>
        
        <div className={`bg-gradient-to-br from-emerald-50/10 to-emerald-100/10 border border-emerald-200/20 rounded-lg p-4 transition-all duration-200 ${isShowingHovered ? 'ring-2 ring-emerald-500/20' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <div>
              <p className="text-xs font-medium text-emerald-400 uppercase tracking-wide">Confirmed</p>
              <p className="text-xs text-muted-foreground">
                {isShowingHovered ? hoveredMonthYear : 'Total Revenue'}
              </p>
              <p className="text-xl font-bold text-emerald-500">{formatPrice(displayData?.confirmed || 0)}</p>
            </div>
          </div>
        </div>
        
        <div className={`bg-gradient-to-br from-red-50/10 to-red-100/10 border border-red-200/20 rounded-lg p-4 transition-all duration-200 ${isShowingHovered ? 'ring-2 ring-red-500/20' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div>
              <p className="text-xs font-medium text-red-400 uppercase tracking-wide">Cancelled</p>
              <p className="text-xs text-muted-foreground">
                {isShowingHovered ? hoveredMonthYear : 'Total Revenue'}
              </p>
              <p className="text-xl font-bold text-red-500">{formatPrice(displayData?.cancelled || 0)}</p>
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
            onMouseMove={(data) => {
              if (data?.activePayload && data?.activeLabel) {
                const payload = data.activePayload[0]?.payload as EventData;
                if (payload) {
                  setHoveredData(payload);
                  setHoveredMonthYear(payload.fullMonthYear || data.activeLabel);
                }
              }
            }}
            onMouseLeave={() => {
              setHoveredData(null);
              setHoveredMonthYear(null);
            }}
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
            
            {/* Invisible Tooltip for Cursor Effect */}
            <Tooltip 
              content={() => null}
              cursor={{ 
                fill: 'rgba(255, 255, 255, 0.08)',
                stroke: 'rgba(255, 255, 255, 0.1)',
                strokeWidth: 1,
                strokeDasharray: '4 4'
              }}
            />
            
            {/* Enhanced Bars with Gradients */}
            <Bar 
              dataKey="proposed" 
              name="Proposed"
              fill={STATUS_COLORS.proposed}
              radius={[6, 6, 0, 0]}
              stroke="rgba(59, 130, 246, 0.5)"
              strokeWidth={isShowingHovered ? 2 : 1}
            />
            <Bar 
              dataKey="confirmed" 
              name="Confirmed"
              fill={STATUS_COLORS.confirmed}
              radius={[6, 6, 0, 0]}
              stroke="rgba(16, 185, 129, 0.5)"
              strokeWidth={isShowingHovered ? 2 : 1}
            />
            <Bar 
              dataKey="cancelled" 
              name="Cancelled"
              fill={STATUS_COLORS.cancelled}
              radius={[6, 6, 0, 0]}
              stroke="rgba(239, 68, 68, 0.5)"
              strokeWidth={isShowingHovered ? 2 : 1}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>


    </div>
  );
}

RevenueChart.Icon = LucideBarChart;