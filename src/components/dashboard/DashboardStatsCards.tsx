import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  AlertTriangle, 
  TrendingUp,
  Clock,
  UserX
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getWarningTimeframe, OVERBOOKING_WARNING_DAYS } from "@/constants/timeframes";
// Removed unused data hooks - focusing only on operational conflicts and alerts

interface DashboardStatsCardsProps {
  selectedOwnerId?: string;
}

export function DashboardStatsCards({ selectedOwnerId }: DashboardStatsCardsProps) {
  // Only load data we actually need for operational insights

  // Comprehensive operational alerts query
  const { data: operationalAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['operational-alerts', selectedOwnerId],
    queryFn: async () => {
      // Use standard 30-day timeframe for all overbooking warnings
      const { startDate, endDate } = getWarningTimeframe();

      // Equipment conflicts - same day overbookings
      let equipmentQuery = supabase
        .from('project_event_equipment')
        .select(`
          equipment_id,
          quantity,
          equipment:equipment_id!inner (
            name,
            stock
          ),
          project_events!inner (
            date,
            project:projects!inner (
              owner_id
            )
          )
        `)
        .gte('project_events.date', startDate)
        .lte('project_events.date', endDate);

      if (selectedOwnerId) {
        equipmentQuery = equipmentQuery.eq('project_events.project.owner_id', selectedOwnerId);
      }

      // Crew double-bookings - same person assigned to multiple events on same day
      let crewConflictQuery = supabase
        .from('project_event_roles')
        .select(`
          crew_member_id,
          project_events!inner (
            date,
            name,
            project:projects!inner (
              name,
              owner_id
            )
          )
        `)
        .not('crew_member_id', 'is', null)
        .gte('project_events.date', startDate)
        .lte('project_events.date', endDate);

      if (selectedOwnerId) {
        crewConflictQuery = crewConflictQuery.eq('project_events.project.owner_id', selectedOwnerId);
      }

      const [equipmentResult, crewResult] = await Promise.all([
        equipmentQuery,
        crewConflictQuery
      ]);

      if (equipmentResult.error) throw equipmentResult.error;
      if (crewResult.error) throw crewResult.error;

      // Process equipment conflicts by date
      const equipmentByDate = new Map<string, Map<string, { stock: number, totalUsed: number, events: string[] }>>();
      
      equipmentResult.data?.forEach(booking => {
        const date = booking.project_events.date;
        const equipmentId = booking.equipment_id;
        const stock = booking.equipment?.stock || 0;
        const used = booking.quantity || 0;
        
        if (!equipmentByDate.has(date)) {
          equipmentByDate.set(date, new Map());
        }
        
        const dateMap = equipmentByDate.get(date)!;
        if (!dateMap.has(equipmentId)) {
          dateMap.set(equipmentId, { stock, totalUsed: 0, events: [] });
        }
        
        const equipment = dateMap.get(equipmentId)!;
        equipment.totalUsed += used;
        equipment.events.push(booking.project_events.name);
      });

      // Count equipment conflicts
      let equipmentConflicts = 0;
      equipmentByDate.forEach((equipmentMap) => {
        equipmentMap.forEach((equipment) => {
          if (equipment.totalUsed > equipment.stock) {
            equipmentConflicts++;
          }
        });
      });

      // Process crew conflicts by date
      const crewByDate = new Map<string, Map<string, string[]>>();
      
      crewResult.data?.forEach(assignment => {
        const date = assignment.project_events.date;
        const crewId = assignment.crew_member_id;
        const eventName = assignment.project_events.name;
        
        if (!crewByDate.has(date)) {
          crewByDate.set(date, new Map());
        }
        
        const dateMap = crewByDate.get(date)!;
        if (!dateMap.has(crewId)) {
          dateMap.set(crewId, []);
        }
        
        dateMap.get(crewId)!.push(eventName);
      });

      // Count crew conflicts (same person assigned to multiple events same day)
      let crewConflicts = 0;
      crewByDate.forEach((crewMap) => {
        crewMap.forEach((events) => {
          if (events.length > 1) {
            crewConflicts++;
          }
        });
      });

      return { 
        equipmentConflicts,
        crewConflicts,
        totalConflicts: equipmentConflicts + crewConflicts
      };
    }
  });

  // Unassigned roles query - using 30-day timeframe like other warnings
  const { data: unassignedStats, isLoading: unassignedLoading } = useQuery({
    queryKey: ['unassigned-roles-stats', selectedOwnerId],
    queryFn: async () => {
      const { startDate, endDate } = getWarningTimeframe();
      
      let query = supabase
        .from('project_event_roles')
        .select(`
          id,
          event:event_id!inner (
            date,
            project:project_id (
              owner_id
            )
          )
        `)
        .is('crew_member_id', null)
        .gte('event.date', startDate)
        .lte('event.date', endDate);

      if (selectedOwnerId) {
        query = query.eq('event.project.owner_id', selectedOwnerId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return { unassigned: data?.length || 0 };
    }
  });

  // Active crew assignments today
  const { data: activeCrewStats, isLoading: activeCrewLoading } = useQuery({
    queryKey: ['active-crew-stats', selectedOwnerId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      let query = supabase
        .from('project_event_roles')
        .select(`
          id,
          event:event_id!inner (
            date,
            project:project_id (
              owner_id
            )
          )
        `)
        .not('crew_member_id', 'is', null)
        .eq('event.date', today);

      if (selectedOwnerId) {
        query = query.eq('event.project.owner_id', selectedOwnerId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return { activeCrew: data?.length || 0 };
    }
  });

  // Only calculate what we actually need for operational insights

  // Critical operational alerts - what actually matters for production
  const totalConflicts = (operationalAlerts?.equipmentConflicts || 0) + (operationalAlerts?.crewConflicts || 0);
  const unassignedCount = unassignedStats?.unassigned || 0;
  
  const criticalMetrics = [
    // Equipment overbookings
    {
      title: "Equipment Conflicts",
      value: operationalAlerts?.equipmentConflicts || 0,
      subtitle: operationalAlerts?.equipmentConflicts 
        ? `${operationalAlerts.equipmentConflicts} overbookings next ${OVERBOOKING_WARNING_DAYS} days` 
        : `No equipment conflicts next ${OVERBOOKING_WARNING_DAYS} days`,
      icon: AlertTriangle,
      color: operationalAlerts?.equipmentConflicts ? "text-red-500" : "text-green-500",
      bgColor: operationalAlerts?.equipmentConflicts ? "from-red-50/10 to-red-100/10" : "from-green-50/10 to-green-100/10",
      borderColor: operationalAlerts?.equipmentConflicts ? "border-red-200/20" : "border-green-200/20",
      loading: alertsLoading,
      priority: operationalAlerts?.equipmentConflicts ? "critical" : "operational"
    },
    // Crew double-bookings
    {
      title: "Crew Conflicts",
      value: operationalAlerts?.crewConflicts || 0,
      subtitle: operationalAlerts?.crewConflicts 
        ? `${operationalAlerts.crewConflicts} double-bookings next ${OVERBOOKING_WARNING_DAYS} days`
        : `No crew conflicts next ${OVERBOOKING_WARNING_DAYS} days`,
      icon: Users,
      color: operationalAlerts?.crewConflicts ? "text-red-500" : "text-green-500",
      bgColor: operationalAlerts?.crewConflicts ? "from-red-50/10 to-red-100/10" : "from-green-50/10 to-green-100/10",
      borderColor: operationalAlerts?.crewConflicts ? "border-red-200/20" : "border-green-200/20",
      loading: alertsLoading,
      priority: operationalAlerts?.crewConflicts ? "critical" : "operational"
    },
    // Unassigned roles
    {
      title: "Unassigned Roles",
      value: unassignedCount,
      subtitle: unassignedCount 
        ? `${unassignedCount} roles need crew next ${OVERBOOKING_WARNING_DAYS} days` 
        : `All roles assigned next ${OVERBOOKING_WARNING_DAYS} days`,
      icon: UserX,
      color: unassignedCount ? "text-amber-500" : "text-green-500",
      bgColor: unassignedCount ? "from-amber-50/10 to-amber-100/10" : "from-green-50/10 to-green-100/10",
      borderColor: unassignedCount ? "border-amber-200/20" : "border-green-200/20",
      loading: unassignedLoading,
      priority: unassignedCount ? "high" : "operational"
    },
    // Current operations
    {
      title: "Active Crew Today",
      value: activeCrewStats?.activeCrew || 0,
      subtitle: activeCrewStats?.activeCrew 
        ? `${activeCrewStats.activeCrew} crew members deployed`
        : "No active assignments today",
      icon: Clock,
      color: "text-blue-500",
      bgColor: "from-blue-50/10 to-blue-100/10",
      borderColor: "border-blue-200/20",
      loading: activeCrewLoading,
      priority: "operational"
    }
  ];

  // Group metrics by priority for clean display
  const criticalIssues = criticalMetrics.filter(m => m.priority === 'critical');
  const highPriorityAlerts = criticalMetrics.filter(m => m.priority === 'high');
  const operationalStatus = criticalMetrics.filter(m => m.priority === 'operational');

  // Check if we have any issues that need attention
  const hasIssues = criticalIssues.some(m => m.value > 0) || highPriorityAlerts.some(m => m.value > 0);

  return (
    <div className="space-y-6">
      {/* All Systems - Compact 4-column grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {criticalMetrics.map((stat, index) => (
          <OperationalCard key={index} stat={stat} />
        ))}
      </div>

      {/* All Clear Status - Only show when no issues */}
      {!hasIssues && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50/10 border border-green-200/20">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <p className="text-green-500 font-medium">All systems operational - no conflicts detected</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Unified operational card with consistent styling and priority indicators
function OperationalCard({ stat }: { stat: any }) {
  const IconComponent = stat.icon;
  const hasCriticalIssue = stat.priority === 'critical' && stat.value > 0;
  const hasHighPriorityIssue = stat.priority === 'high' && stat.value > 0;
  
  return (
    <Card className={`border-0 shadow-md bg-gradient-to-br ${stat.bgColor} border ${stat.borderColor} relative overflow-hidden transition-all hover:shadow-lg`}>
      {/* Priority indicator bar */}
      {hasCriticalIssue && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-red-600"></div>
      )}
      {hasHighPriorityIssue && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-amber-600"></div>
      )}
      
      <CardContent className="p-2">
        <div className="text-center space-y-1">
          <div className={`mx-auto w-8 h-8 rounded-lg bg-background/20 flex items-center justify-center`}>
            <IconComponent className={`h-4 w-4 ${stat.color}`} />
          </div>
          {!stat.loading ? (
            <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
          ) : (
            <Skeleton className="h-5 w-6 mx-auto" />
          )}
          <p className="text-xs font-medium truncate">{stat.title}</p>
          <p className="text-xs text-muted-foreground/60 truncate">{stat.subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

