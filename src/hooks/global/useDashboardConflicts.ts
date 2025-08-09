/**
 * 🎯 DASHBOARD CONFLICTS - UNIFIED STOCK ENGINE VERSION
 * 
 * Replaces fragmented conflict detection with unified stock engine.
 * Now includes virtual stock from subrental orders in conflict calculations.
 * 
 * BREAKING CHANGE: Now uses effective stock (base + virtual) instead of just base stock.
 * This means confirmed subrentals will resolve conflicts automatically.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDashboardStockConflicts } from '@/hooks/stock/useStockEngine';
import { ConflictAnalysis } from '@/types/stock';
import { supabase } from '@/integrations/supabase/client';
import { getWarningTimeframe } from '@/constants/timeframes';

interface EquipmentConflict {
  equipmentId: string;
  equipmentName: string;
  date: string;
  totalStock: number;
  totalUsed: number;
  overbooked: number;
  conflictingEvents: {
    eventName: string;
    projectName: string;
    quantity: number;
  }[];
}

interface CrewConflict {
  crewMemberId: string;
  crewMemberName: string;
  date: string;
  conflictingAssignments: {
    eventName: string;
    projectName: string;
    role: string;
  }[];
}

export function useDashboardConflicts(selectedOwner?: string) {
  // Test database function on first load
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      testDatabaseFunction().catch(console.error);
    }
  }, []);

  // Use the new unified stock engine for equipment conflicts
  const stockEngine = useDashboardStockConflicts(selectedOwner);

  // Transform conflicts to match the old interface for backward compatibility
  const equipmentConflicts = useMemo((): EquipmentConflict[] => {
    return stockEngine.conflicts.map((conflict: ConflictAnalysis) => ({
      equipmentId: conflict.equipmentId,
      equipmentName: conflict.equipmentName,
      date: conflict.date,
      totalStock: conflict.stockBreakdown.effectiveStock, // Now includes virtual stock!
      totalUsed: conflict.stockBreakdown.totalUsed,
      overbooked: conflict.conflict.deficit,
      conflictingEvents: conflict.conflict.affectedEvents.map(event => ({
        eventName: event.eventName,
        projectName: event.projectName,
        quantity: event.quantity
      }))
    }));
  }, [stockEngine.conflicts]);

  // Crew conflicts still use the old logic (not affected by virtual stock)
  const { startDate, endDate } = getWarningTimeframe();

  const { data: crewConflicts, isLoading: isLoadingCrew } = useQuery({
    queryKey: ['dashboard-crew-conflicts', startDate, endDate, selectedOwner],
    queryFn: async () => {
      // Get crew double-bookings
      let rolesQuery = supabase
        .from('project_event_roles')
        .select(`
          id, crew_member_id, role_id,
          project_events!inner (
            date, name, project_id,
            project:projects!inner (name, owner_id)
          ),
          crew_members!inner (name),
          crew_roles (name)
        `)
        .not('crew_member_id', 'is', null)
        .gte('project_events.date', startDate)
        .lte('project_events.date', endDate);

      if (selectedOwner) {
        rolesQuery = rolesQuery.eq('project_events.project.owner_id', selectedOwner);
      }

      const { data: roles, error } = await rolesQuery;
      if (error) throw error;
      
      // Debug logging for crew conflicts
      if (process.env.NODE_ENV === 'development') {
        console.log('👥 Crew roles fetched for conflicts:', roles?.length || 0);
        console.log('📅 Date range:', { startDate, endDate });
        if (selectedOwner) console.log('👤 Owner filter:', selectedOwner);
      }
      
      if (!roles?.length) return [];

      // Group by crew member and date
      const assignmentsByMemberAndDate = new Map<string, {
        crewMember: any;
        date: string;
        assignments: Array<{
          eventName: string;
          projectName: string;
          role: string;
        }>;
      }>();

      roles.forEach(role => {
        if (!role.crew_member_id || !role.project_events) return;
        
        const key = `${role.crew_member_id}-${role.project_events.date}`;
        
        if (!assignmentsByMemberAndDate.has(key)) {
          assignmentsByMemberAndDate.set(key, {
            crewMember: role.crew_members,
            date: role.project_events.date,
            assignments: []
          });
        }
        
        const dayAssignment = assignmentsByMemberAndDate.get(key)!;
        dayAssignment.assignments.push({
          eventName: role.project_events.name,
          projectName: role.project_events.project.name,
          role: role.crew_roles?.name || 'Unknown'
        });
      });

      // Find double-bookings (more than 1 assignment per day)
      const conflicts: CrewConflict[] = [];
      
      assignmentsByMemberAndDate.forEach(dayAssignment => {
        if (dayAssignment.assignments.length > 1) {
          conflicts.push({
            crewMemberId: dayAssignment.crewMember.id,
            crewMemberName: dayAssignment.crewMember.name,
            date: dayAssignment.date,
            conflictingAssignments: dayAssignment.assignments
          });
        }
      });

      // Debug logging for crew conflicts
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ Crew conflicts found:', conflicts.length);
        console.log('📊 Total assignment days processed:', assignmentsByMemberAndDate.size);
        if (conflicts.length > 0) {
          console.log('🚨 Crew conflicts details:', conflicts);
        }
      }

      return conflicts;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
    retry: 1,
    enabled: true // Always enabled for dashboard usage
  });

  return {
    equipmentConflicts,
    crewConflicts: crewConflicts || [],
    equipmentConflictCount: equipmentConflicts.length,
    crewConflictCount: crewConflicts?.length || 0,
    isLoading: (stockEngine as any).isLoading || isLoadingCrew,
    error: (stockEngine as any).error,
    
    // Additional data from new engine
    totalConflicts: stockEngine.totalConflicts,
    totalDeficit: stockEngine.totalDeficit,
    affectedEquipmentCount: stockEngine.affectedEquipmentCount,
    suggestions: stockEngine.suggestions
  };
}