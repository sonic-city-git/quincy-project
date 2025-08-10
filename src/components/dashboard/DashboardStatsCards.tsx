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
import { useDashboardCrewConflicts } from "@/hooks/useCrewEngine";
import { useUnassignedRoles, useActiveCrew } from "./shared/useDashboardData";
import { OVERBOOKING_WARNING_DAYS } from "@/constants/timeframes";

interface DashboardStatsCardsProps {
  selectedOwnerId?: string;
}

export function DashboardStatsCards({ selectedOwnerId }: DashboardStatsCardsProps) {
  
  // OPTIMIZED: Lightweight wrappers for dashboard
  const {
    conflictCount,
    urgentConflictCount,
    isLoading: stockLoading,
    error: stockError
  } = useDashboardConflicts(selectedOwnerId);
  
  // ✅ NEW: Crew engine integration
  const {
    conflictCount: crewConflictCount,
    unfilledRoleCount,
    isLoading: crewLoading,
    error: crewError
  } = useDashboardCrewConflicts(selectedOwnerId);

  // Keep active crew stats 
  const { data: activeCrewStats, isLoading: activeCrewLoading } = useActiveCrew(selectedOwnerId);

  // SIMPLE CALCULATIONS - From optimized wrappers
  const equipmentOverbookings = conflictCount; // Equipment conflicts in next 30 days
  const urgentEquipmentOverbookings = urgentConflictCount; // High/critical severity conflicts
  const crewOverbookings = crewConflictCount; // Crew conflicts in next 30 days
  const unfilledRoles = unfilledRoleCount; // Unfilled roles in next 30 days
  const activeCrew = activeCrewStats?.activeCrew || 0;

  // System health check
  const hasIssues = equipmentOverbookings > 0 || crewOverbookings > 0 || unfilledRoles > 0;
  const systemStatus = (stockError || crewError) ? 'error' : 
                      (urgentEquipmentOverbookings > 0 || crewOverbookings > 0) ? 'critical' :
                      (equipmentOverbookings > 0 || unfilledRoles > 0) ? 'warning' : 'success';

  return (
    <div className="space-y-6">
      
      {/* Error State */}
      {(stockError || crewError) && (
        <StatusCard
          title="System Error"
          value="Error"
          subtitle={`Engine error: ${stockError?.message || crewError?.message || 'Unknown error'}`}
          icon={AlertTriangle}
          status="critical"
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

        {/* Crew Overbookings - ✅ CREW ENGINE INTEGRATED */}
        <StatusCard
          title="Crew Overbookings"
          value={crewOverbookings}
          subtitle={crewOverbookings 
            ? `${crewOverbookings} crew double-booked next ${OVERBOOKING_WARNING_DAYS} days` 
            : `No crew overbookings next ${OVERBOOKING_WARNING_DAYS} days`}
          icon={Users}
          status={getStatusFromValue(crewOverbookings, { critical: 1, success: 0 })}
          variant="compact"
          loading={crewLoading}
        />

        {/* Unfilled Roles - ✅ CREW ENGINE INTEGRATED */}
        <StatusCard
          title="Unfilled Roles"
          value={unfilledRoles}
          subtitle={unfilledRoles 
            ? `${unfilledRoles} roles need crew assignment next ${OVERBOOKING_WARNING_DAYS} days` 
            : `All roles filled next ${OVERBOOKING_WARNING_DAYS} days`}
          icon={UserX}
          status={getStatusFromValue(unfilledRoles, { warning: 1, success: 0 })}
          variant="compact"
          loading={crewLoading}
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
            {systemStatus === 'success' && 'All systems operational - crew & equipment engines active'}
            {systemStatus === 'warning' && 'System operational - conflicts or unfilled roles detected'}
            {systemStatus === 'critical' && 'Urgent crew or equipment conflicts require immediate attention'}
            {systemStatus === 'error' && 'System error - check connection'}
          </p>
        </div>
      </div>
      
    </div>
  );
}