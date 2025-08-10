/**
 * DASHBOARD STATS CARDS - ONE ENGINE VERSION
 * 
 * ✅ MIGRATED TO ONE ENGINE ARCHITECTURE
 * ❌ DELETED: useOperationalAlerts (fragmented logic)
 * ✅ USES: useDashboardConflicts (optimized dashboard wrapper)
 * 
 * Benefits:
 * - Single source of truth for all stock/conflict data
 * - Real-time virtual stock calculations
 * - No translation layers or adapters
 * - Automatic consistency across entire app
 */

import { 
  Users, 
  AlertTriangle, 
  TrendingUp,
  Clock,
  UserX,
  Zap
} from "lucide-react";
import { StatusCard, StatusCardGrid, getStatusFromValue } from "./shared/StatusCard";
import { useDashboardConflicts } from "@/hooks/useDashboardConflicts";
import { useUnassignedRoles, useActiveCrew } from "./shared/useDashboardData";
import { OVERBOOKING_WARNING_DAYS } from "@/constants/timeframes";

interface DashboardStatsCardsProps {
  selectedOwnerId?: string;
}

export function DashboardStatsCards({ selectedOwnerId }: DashboardStatsCardsProps) {
  
  // OPTIMIZED: Lightweight wrapper for dashboard
  const {
    conflictCount,
    urgentConflictCount,
    isLoading: stockLoading,
    error: stockError
  } = useDashboardConflicts(selectedOwnerId);
  
  // Debug removed - check conflict analysis logs
  


  // Keep crew/unassigned data (not part of stock engine yet)
  const { data: unassignedStats, isLoading: unassignedLoading } = useUnassignedRoles(selectedOwnerId);
  const { data: activeCrewStats, isLoading: activeCrewLoading } = useActiveCrew(selectedOwnerId);

  // SIMPLE CALCULATIONS - From optimized wrapper
  const equipmentOverbookings = conflictCount; // Equipment conflicts in next 30 days
  const urgentEquipmentOverbookings = urgentConflictCount; // High/critical severity conflicts
  const unassignedCount = unassignedStats?.unassigned || 0;
  const activeCrew = activeCrewStats?.activeCrew || 0;

  // System health check
  const hasIssues = equipmentOverbookings > 0 || unassignedCount > 0;
  const systemStatus = stockError ? 'error' : 
                      urgentEquipmentOverbookings > 0 ? 'critical' :
                      equipmentOverbookings > 0 ? 'warning' : 'success';

  return (
    <div className="space-y-6">
      
      {/* Error State */}
      {stockError && (
        <StatusCard
          title="System Error"
          value="Error"
          subtitle={`Stock engine error: ${stockError.message}`}
          icon={AlertTriangle}
          status="error"
          variant="compact"
        />
      )}

      {/* Main Operational Metrics */}
      <StatusCardGrid columns={3}>
        
        {/* Equipment Overbookings - Virtual Stock Aware */}
        <StatusCard
          title="Equipment Overbookings"
          value={equipmentOverbookings}
          subtitle={equipmentOverbookings 
            ? `${equipmentOverbookings} overbooked items (${urgentEquipmentOverbookings} urgent) next ${OVERBOOKING_WARNING_DAYS} days` 
            : `No equipment overbookings next ${OVERBOOKING_WARNING_DAYS} days`}
          icon={AlertTriangle}
          status={getStatusFromValue(equipmentOverbookings, { critical: 1, success: 0 })}
          variant="compact"
          loading={stockLoading}
        />

        {/* Crew Overbookings - Phase 6: Crew engine integration */}
        <StatusCard
          title="Crew Overbookings"
          value={0}
          subtitle="Crew conflict detection coming soon"
          icon={Users}
          status="info"
          variant="compact"
          loading={false}
        />

        {/* Unassigned Roles */}
        <StatusCard
          title="Unfilled Roles"
          value={unassignedCount}
          subtitle={unassignedCount 
            ? `${unassignedCount} roles need crew next ${OVERBOOKING_WARNING_DAYS} days` 
            : `All roles filled next ${OVERBOOKING_WARNING_DAYS} days`}
          icon={UserX}
          status={getStatusFromValue(unassignedCount, { warning: 1, success: 0 })}
          variant="compact"
          loading={unassignedLoading}
        />
        
      </StatusCardGrid>

      {/* System Status Indicator */}
      <div className="text-center py-4">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${
          systemStatus === 'success' ? 'bg-green-50/10 border-green-200/20' :
          systemStatus === 'warning' ? 'bg-yellow-50/10 border-yellow-200/20' :
          systemStatus === 'critical' ? 'bg-red-50/10 border-red-200/20' :
          'bg-gray-50/10 border-gray-200/20'
        }`}>
          <Zap className={`h-5 w-5 ${
            systemStatus === 'success' ? 'text-green-500' :
            systemStatus === 'warning' ? 'text-yellow-500' :
            systemStatus === 'critical' ? 'text-red-500' :
            'text-gray-500'
          }`} />
          <p className={`font-medium ${
            systemStatus === 'success' ? 'text-green-500' :
            systemStatus === 'warning' ? 'text-yellow-500' :
            systemStatus === 'critical' ? 'text-red-500' :
            'text-gray-500'
          }`}>
            {systemStatus === 'success' && 'All systems operational - virtual stock engine active'}
            {systemStatus === 'warning' && 'System operational - conflicts detected'}
            {systemStatus === 'critical' && 'Urgent conflicts require immediate attention'}
            {systemStatus === 'error' && 'System error - check connection'}
          </p>
        </div>
      </div>
      
    </div>
  );
}