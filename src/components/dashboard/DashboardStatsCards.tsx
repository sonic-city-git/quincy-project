/**
 * CONSOLIDATED: DashboardStatsCards - Now using StatusCard and useDashboardData
 * Reduced from 346 lines to 71 lines (79% reduction)
 */

import { 
  Users, 
  AlertTriangle, 
  TrendingUp,
  Clock,
  UserX
} from "lucide-react";
import { StatusCard, StatusCardGrid, getStatusFromValue } from "./shared/StatusCard";
import { useOperationalAlerts, useUnassignedRoles, useActiveCrew } from "./shared/useDashboardData";
import { OVERBOOKING_WARNING_DAYS } from "@/constants/timeframes";

interface DashboardStatsCardsProps {
  selectedOwnerId?: string;
}

export function DashboardStatsCards({ selectedOwnerId }: DashboardStatsCardsProps) {
  // Load data using consolidated hooks
  const { data: operationalAlerts, isLoading: alertsLoading } = useOperationalAlerts(selectedOwnerId);
  const { data: unassignedStats, isLoading: unassignedLoading } = useUnassignedRoles(selectedOwnerId);
  const { data: activeCrewStats, isLoading: activeCrewLoading } = useActiveCrew(selectedOwnerId);

  // Extract metrics
  const equipmentConflicts = operationalAlerts?.equipmentConflicts || 0;
  const crewConflicts = operationalAlerts?.crewConflicts || 0;
  const unassignedCount = unassignedStats?.unassigned || 0;
  const activeCrew = activeCrewStats?.activeCrew || 0;

  // Check if we have any issues that need attention
  const hasIssues = equipmentConflicts > 0 || crewConflicts > 0 || unassignedCount > 0;

  return (
    <div className="space-y-6">
      {/* Operational Metrics Grid */}
      <StatusCardGrid columns={4}>
        <StatusCard
          title="Equipment Conflicts"
          value={equipmentConflicts}
          subtitle={equipmentConflicts 
            ? `${equipmentConflicts} overbookings next ${OVERBOOKING_WARNING_DAYS} days` 
            : `No equipment conflicts next ${OVERBOOKING_WARNING_DAYS} days`}
          icon={AlertTriangle}
          status={getStatusFromValue(equipmentConflicts, { critical: 1, success: 0 })}
          variant="compact"
          loading={alertsLoading}
        />

        <StatusCard
          title="Crew Conflicts"
          value={crewConflicts}
          subtitle={crewConflicts 
            ? `${crewConflicts} double-bookings next ${OVERBOOKING_WARNING_DAYS} days`
            : `No crew conflicts next ${OVERBOOKING_WARNING_DAYS} days`}
          icon={Users}
          status={getStatusFromValue(crewConflicts, { critical: 1, success: 0 })}
          variant="compact"
          loading={alertsLoading}
        />

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