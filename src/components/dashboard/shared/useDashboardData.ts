/**
 * CONSOLIDATED DASHBOARD DATA HOOK
 * 
 * Eliminates duplication between DashboardStatsCards and RevenueChart
 * Provides unified data fetching patterns with owner-based filtering
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getWarningTimeframe } from "@/constants/timeframes";
import { useDashboardConflicts } from "@/hooks/useDashboardConflicts";

// Common query options for dashboard data
const DASHBOARD_QUERY_OPTIONS = {
  staleTime: 1000 * 60 * 2, // 2 minutes
  refetchOnWindowFocus: true,
  retry: 1
};

/**
 * Get project IDs for owner-based filtering
 * Reusable utility for owner-filtered queries
 */
async function getProjectIdsForOwner(ownerId?: string): Promise<string[]> {
  if (!ownerId) return [];
  
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id')
    .eq('owner_id', ownerId);

  if (error) {
    console.error('Error fetching projects for owner:', error);
    throw error;
  }

  return (projects || []).map(p => p.id);
}

/**
 * Build owner-filtered query for any table with project relationships
 */
function buildOwnerFilteredQuery(
  baseQuery: any,
  ownerId?: string,
  projectIds?: string[],
  projectFieldName: string = 'project_id'
) {
  if (!ownerId || !projectIds || projectIds.length === 0) {
    return baseQuery;
  }
  return baseQuery.in(projectFieldName, projectIds);
}

/**
 * Operational alerts data (conflicts, overbookings, etc.)
 * 
 * CRITICAL FIX: Now uses dashboard-specific conflict detection that fetches ALL equipment
 * conflicts regardless of planner folder expansion state. The previous implementation 
 * only showed conflicts for expanded folders, making dashboard metrics unreliable.
 */
export function useOperationalAlerts(selectedOwnerId?: string) {
  const { 
    equipmentConflictCount, 
    crewConflictCount, 
    isLoading,
    error 
  } = useDashboardConflicts(selectedOwnerId);

  // Transform to match expected interface
  return {
    data: { 
      equipmentConflicts: equipmentConflictCount, 
      crewConflicts: crewConflictCount 
    },
    isLoading,
    error
  };
}

/**
 * Unassigned roles data
 */
export function useUnassignedRoles(selectedOwnerId?: string) {
  return useQuery({
    queryKey: ['unassigned-roles', selectedOwnerId],
    queryFn: async () => {
      const { startDate, endDate } = getWarningTimeframe();
      let projectIds: string[] = [];

      if (selectedOwnerId) {
        projectIds = await getProjectIdsForOwner(selectedOwnerId);
        if (projectIds.length === 0) {
          return { unassigned: 0 };
        }
      }

      let query = supabase
        .from('project_event_roles')
        .select(`
          project_events!inner (
            date,
            project:projects!inner (
              owner_id
            )
          )
        `)
        .is('crew_member_id', null)
        .gte('project_events.date', startDate)
        .lte('project_events.date', endDate);

      query = buildOwnerFilteredQuery(
        query,
        selectedOwnerId,
        projectIds,
        'project_events.project.owner_id'
      );

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching unassigned roles:', error);
        throw error;
      }

      return { unassigned: data?.length || 0 };
    },
    ...DASHBOARD_QUERY_OPTIONS
  });
}

/**
 * Active crew today data
 */
export function useActiveCrew(selectedOwnerId?: string) {
  return useQuery({
    queryKey: ['active-crew', selectedOwnerId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      let projectIds: string[] = [];

      if (selectedOwnerId) {
        projectIds = await getProjectIdsForOwner(selectedOwnerId);
        if (projectIds.length === 0) {
          return { activeCrew: 0 };
        }
      }

      let query = supabase
        .from('project_event_roles')
        .select(`
          crew_member_id,
          project_events!inner (
            date,
            project:projects!inner (
              owner_id
            )
          )
        `)
        .not('crew_member_id', 'is', null)
        .eq('project_events.date', today);

      query = buildOwnerFilteredQuery(
        query,
        selectedOwnerId,
        projectIds,
        'project_events.project.owner_id'
      );

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching active crew:', error);
        throw error;
      }

      // Count unique crew members
      const uniqueCrewIds = new Set(data?.map(role => role.crew_member_id) || []);
      
      return { activeCrew: uniqueCrewIds.size };
    },
    ...DASHBOARD_QUERY_OPTIONS
  });
}

/**
 * Revenue data for charts
 */
export function useRevenueData(ownerId?: string) {
  return useQuery({
    queryKey: ['revenue-events', ownerId],
    queryFn: async () => {
      let projectIds: string[] = [];

      if (ownerId) {
        projectIds = await getProjectIdsForOwner(ownerId);
        if (projectIds.length === 0) {
          return { 
            chartData: [], 
            summaryData: { proposed: 0, confirmed: 0, cancelled: 0 } 
          };
        }
      }

      let query = supabase
        .from('project_events')
        .select('date, total_price, status');

      query = buildOwnerFilteredQuery(query, ownerId, projectIds, 'project_id');
      
      const { data, error } = await query.order('date');
      
      if (error) {
        console.error('Error fetching events:', error);
        throw error;
      }

      // Process revenue data (monthly aggregation logic)
      const currentYear = new Date().getFullYear();
      const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
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

      // Aggregate data by month
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

      // Convert to chart format
      const chartData = monthOrder.map(month => {
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
      const summaryData = {
        proposed: (data || []).reduce((sum, event) => 
          event.status === 'proposed' ? sum + (event.total_price || 0) : sum, 0),
        confirmed: (data || []).reduce((sum, event) => 
          event.status === 'confirmed' ? sum + (event.total_price || 0) : sum, 0),
        cancelled: (data || []).reduce((sum, event) => 
          event.status === 'cancelled' ? sum + (event.total_price || 0) : sum, 0),
      };

      return { chartData, summaryData };
    },
    ...DASHBOARD_QUERY_OPTIONS
  });
}