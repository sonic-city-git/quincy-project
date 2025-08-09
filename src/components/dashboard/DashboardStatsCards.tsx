/**
 * DASHBOARD STATS CARDS - ONE ENGINE VERSION
 * 
 * ✅ MIGRATED TO ONE ENGINE ARCHITECTURE
 * ❌ DELETED: useOperationalAlerts (fragmented logic)
 * ✅ USES: useDashboardStock (unified global engine)
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
import { useDashboardStock } from "@/hooks/useGlobalStockEngine";
import { useUnassignedRoles, useActiveCrew } from "./shared/useDashboardData";
import { OVERBOOKING_WARNING_DAYS } from "@/constants/timeframes";

interface DashboardStatsCardsProps {
  selectedOwnerId?: string;
}

export function DashboardStatsCards({ selectedOwnerId }: DashboardStatsCardsProps) {
  
  // ONE ENGINE - Direct access to unified stock data
  const {
    conflicts,
    suggestions,
    totalConflicts,
    isLoading: stockLoading,
    error: stockError
  } = useDashboardStock(selectedOwnerId);

  // Keep crew/unassigned data (not part of stock engine yet)
  const { data: unassignedStats, isLoading: unassignedLoading } = useUnassignedRoles(selectedOwnerId);
  const { data: activeCrewStats, isLoading: activeCrewLoading } = useActiveCrew(selectedOwnerId);

  // DIRECT CALCULATIONS - No translation needed
  const equipmentConflicts = conflicts.filter(c => c.conflict.severity !== 'low').length;
  const urgentConflicts = conflicts.filter(c => c.conflict.severity === 'high').length;
  const availableSuggestions = suggestions.length;
  const unassignedCount = unassignedStats?.unassigned || 0;
  const activeCrew = activeCrewStats?.activeCrew || 0;

  // System health check
  const hasIssues = equipmentConflicts > 0 || unassignedCount > 0;
  const systemStatus = stockError ? 'error' : 
                      urgentConflicts > 0 ? 'critical' :
                      equipmentConflicts > 0 ? 'warning' : 'success';

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
      <StatusCardGrid columns={4}>
        
        {/* Equipment Conflicts - Virtual Stock Aware */}
        <StatusCard
          title="Equipment Conflicts"
          value={equipmentConflicts}
          subtitle={equipmentConflicts 
            ? `${equipmentConflicts} overbookings (${urgentConflicts} urgent) next ${OVERBOOKING_WARNING_DAYS} days` 
            : `No equipment conflicts next ${OVERBOOKING_WARNING_DAYS} days`}
          icon={AlertTriangle}
          status={getStatusFromValue(equipmentConflicts, { critical: 1, success: 0 })}
          variant="compact"
          loading={stockLoading}
        />

        {/* Subrental Solutions Available */}
        <StatusCard
          title="Subrental Solutions"
          value={availableSuggestions}
          subtitle={availableSuggestions 
            ? `${availableSuggestions} subrental options available`
            : "No subrental suggestions needed"}
          icon={TrendingUp}
          status={availableSuggestions > 0 ? "info" : "success"}
          variant="compact"
          loading={stockLoading}
        />

        {/* Unassigned Roles */}
        <StatusCard
          title="Unassigned Roles"
          value={unassignedCount}
          subtitle={unassignedCount 
            ? `${unassignedCount} roles need crew next ${OVERBOOKING_WARNING_DAYS} days` 
            : `All roles assigned next ${OVERBOOKING_WARNING_DAYS} days`}
          icon={UserX}
          status={getStatusFromValue(unassignedCount, { warning: 1, success: 0 })}
          variant="compact"
          loading={unassignedLoading}
        />

        {/* Active Crew Today */}
        <StatusCard
          title="Active Crew Today"
          value={activeCrew}
          subtitle={activeCrew 
            ? `${activeCrew} crew members deployed`
            : "No active assignments today"}
          icon={Clock}
          status="info"
          variant="compact"
          loading={activeCrewLoading}
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