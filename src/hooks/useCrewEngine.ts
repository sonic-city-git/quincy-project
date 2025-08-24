/**
 * 🎯 CREW ENGINE - SIMPLIFIED ASSIGNMENT TRACKING
 * 
 * Ultra-simple crew management following equipment engine patterns.
 * Core logic: Assign people to gigs. Show conflicts if overbooked. Show unfilled roles.
 * 
 * Key Principles:
 * - Crew is either ASSIGNED or AVAILABLE (no virtual crew)
 * - Conflicts are simply: assignmentCount > 1 on same date
 * - Role fulfillment: either filled or unfilled
 * - Single source of truth for all crew operations
 */

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { getWarningTimeframe } from '@/constants/timeframes';
import { CACHE_STRATEGIES } from '@/types/stock-optimized';

// =============================================================================
// TYPES - SIMPLIFIED
// =============================================================================

export interface CrewMember {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  folder_id?: string;
  folderName?: string;
  roles?: string[];
  avatar_url?: string;
}

export interface CrewAssignment {
  crewMemberId: string;
  crewMemberName: string;
  date: string;
  assignments: Array<{
    id: string;
    eventId: string;
    eventName: string;
    projectName: string;
    roleName: string;
    dailyRate?: number;
    eventType?: string;
    eventTypeColor?: string;
    location?: string;
  }>;
  assignmentCount: number;
  isOverbooked: boolean; // Simply: assignmentCount > 1
}

export interface UnfilledRole {
  id: string;
  eventId: string;
  eventName: string;
  projectName: string;
  date: string;
  roleName: string;
  eventType?: string;
  eventTypeColor?: string;
  location?: string;
}

export interface CrewConflict {
  crewMemberId: string;
  crewMemberName: string;
  date: string;
  conflictingAssignments: Array<{
    eventName: string;
    projectName: string;
    roleName: string;
  }>;
  assignmentCount: number;
}

// =============================================================================
// ENGINE INTERFACE
// =============================================================================

export interface CrewEngineConfig {
  dateRange: { start: Date; end: Date };
  cacheResults?: boolean;
  cacheStrategy?: 'dashboard' | 'project' | 'timeline' | 'search';
}

export interface CrewEngineResult {
  // CORE DATA
  crew: Map<string, CrewMember>;
  assignments: Map<string, CrewAssignment>; // "crewId-date" -> assignment
  
  // CONFLICT & UNFILLED DATA
  conflicts: CrewConflict[];
  unfilledRoles: UnfilledRole[];
  
  // DATE RANGE
  startDate: string;
  endDate: string;
  
  // SUMMARY DATA
  totalConflicts: number;
  totalUnfilledRoles: number;
  affectedCrewCount: number;
  
  // UNIVERSAL METHODS
  getAssignment: (crewId: string, date: string) => CrewAssignment | null;
  isOverbooked: (crewId: string, date: string) => boolean;
  isAvailable: (crewId: string, date: string) => boolean;
  getConflicts: (filters?: CrewConflictFilters) => CrewConflict[];
  getUnfilledRoles: (filters?: UnfilledRoleFilters) => UnfilledRole[];
  
  // STATUS
  isLoading: boolean;
  error: Error | null;
}

export interface CrewConflictFilters {
  crewIds?: string[];
  dates?: string[];
  minConflictCount?: number;
}

export interface UnfilledRoleFilters {
  eventIds?: string[];
  dates?: string[];
  roleNames?: string[];
}

// =============================================================================
// CACHE CONFIGURATION
// =============================================================================

function getCacheConfig(strategy: string, cacheResults: boolean) {
  if (!cacheResults) {
    return { staleTime: 0, gcTime: 1000 };
  }
  
  return CACHE_STRATEGIES[strategy] || CACHE_STRATEGIES.timeline;
}

// =============================================================================
// THE CREW ENGINE
// =============================================================================

export function useCrewEngine(config: CrewEngineConfig): CrewEngineResult {
  const {
    dateRange,
    cacheResults = true,
    cacheStrategy = 'timeline'
  } = config;
  
  const startDate = format(dateRange.start, 'yyyy-MM-dd');
  const endDate = format(dateRange.end, 'yyyy-MM-dd');
  
  // ============================================================================
  // CREW DATA - Global crew members
  // ============================================================================
  
  const { 
    data: crew = new Map(), 
    isLoading: isLoadingCrew 
  } = useQuery({
    queryKey: ['crew-global'],
    queryFn: async () => {
      const [crewResult, foldersResult, memberRolesResult, rolesResult] = await Promise.all([
        supabase.from('crew_members').select('*').order('name'),
        supabase.from('crew_folders').select('*'),
        supabase.from('crew_member_roles').select('*'),
        supabase.from('crew_roles').select('*')
      ]);
      
      if (crewResult.error) throw crewResult.error;
      if (foldersResult.error) throw foldersResult.error;
      if (memberRolesResult.error) throw memberRolesResult.error;
      if (rolesResult.error) throw rolesResult.error;
      
      // Build folder map
      const folderMap = new Map(foldersResult.data?.map(f => [f.id, f]) || []);
      
      // Build role maps
      const roleIdToName = new Map(rolesResult.data?.map(role => [role.id, role.name]) || []);
      const memberIdToRoles = new Map<string, string[]>();
      
      memberRolesResult.data?.forEach(cmr => {
        if (cmr.crew_member_id && cmr.role_id) {
          const roleName = roleIdToName.get(cmr.role_id);
          if (roleName) {
            if (!memberIdToRoles.has(cmr.crew_member_id)) {
              memberIdToRoles.set(cmr.crew_member_id, []);
            }
            memberIdToRoles.get(cmr.crew_member_id)!.push(roleName);
          }
        }
      });
      
      const crewMap = new Map();
      (crewResult.data || []).forEach(member => {
        const folder = folderMap.get(member.folder_id);
        const roles = memberIdToRoles.get(member.id) || [];
        
        crewMap.set(member.id, {
          id: member.id,
          name: member.name,
          email: member.email,
          phone: member.phone,
          folder_id: member.folder_id,
          folderName: folder?.name || null,
          roles,
          avatar_url: member.avatar_url
        });
      });
      
      return crewMap;
    },
    enabled: true,
    staleTime: getCacheConfig(cacheStrategy, cacheResults).staleTime,
    gcTime: getCacheConfig(cacheStrategy, cacheResults).gcTime,
  });

  // ============================================================================
  // CREW ASSIGNMENTS - Batch query for date range
  // ============================================================================
  
  const { 
    data: rawAssignments = new Map(), 
    isLoading: isLoadingAssignments,
    error: assignmentsError 
  } = useQuery({
    queryKey: ['crew-assignments', Array.from(crew.keys()), startDate, endDate],
    queryFn: async () => {
      const crewIds = Array.from(crew.keys());
      if (crewIds.length === 0) return new Map();
      
      // Single batch query for all crew assignments in date range
      const { data: assignments, error } = await supabase
        .from('project_event_roles')
        .select(`
          id, crew_member_id, daily_rate,
          project_events!inner(
            id, name, date, location,
            projects(name),
            event_types(name, color, needs_crew, needs_equipment)
          ),
          crew_roles(name)
        `)
        .gte('project_events.date', startDate)
        .lte('project_events.date', endDate)
        .neq('project_events.status', 'cancelled')
        .in('crew_member_id', crewIds)
        .not('crew_member_id', 'is', null);

      if (error) throw error;

      const assignmentsByKey = new Map();
      
      assignments?.forEach(assignment => {
        if (!assignment.crew_member_id || !assignment.project_events) return;
        
        const key = `${assignment.crew_member_id}-${assignment.project_events.date}`;
        
        if (!assignmentsByKey.has(key)) {
          const crewMember = crew.get(assignment.crew_member_id);
          assignmentsByKey.set(key, {
            crewMemberId: assignment.crew_member_id,
            crewMemberName: crewMember?.name || 'Unknown',
            date: assignment.project_events.date,
            assignments: [],
            assignmentCount: 0,
            isOverbooked: false
          });
        }
        
        const crewAssignment = assignmentsByKey.get(key);
        const eventTypeColor = assignment.project_events.event_types?.color || '#6B7280';
        const eventTypeName = assignment.project_events.event_types?.name || 'Unknown';
        
        crewAssignment.assignments.push({
          id: assignment.id,
          eventId: assignment.project_events.id,
          eventName: assignment.project_events.name,
          projectName: assignment.project_events.projects?.name || 'Unknown',
          roleName: assignment.crew_roles?.name || 'Unknown',
          dailyRate: assignment.daily_rate,
          eventType: eventTypeName,
          eventTypeColor: eventTypeColor,
          location: assignment.project_events.location
        });
        
        crewAssignment.assignmentCount = crewAssignment.assignments.length;
        crewAssignment.isOverbooked = crewAssignment.assignmentCount > 1; // Simple conflict detection
      });

      return assignmentsByKey;
    },
    enabled: crew.size > 0,
    staleTime: getCacheConfig(cacheStrategy, cacheResults).staleTime,
    gcTime: getCacheConfig(cacheStrategy, cacheResults).gcTime,
  });

  // ============================================================================
  // UNFILLED ROLES - Events that need crew assigned
  // ============================================================================
  
  const { 
    data: unfilledRoles = [], 
    isLoading: isLoadingUnfilled 
  } = useQuery({
    queryKey: ['unfilled-roles', startDate, endDate],
    queryFn: async () => {
      // Find all event roles without crew assigned in date range
      const { data: unfilledRoleData, error } = await supabase
        .from('project_event_roles')
        .select(`
          id,
          project_events!inner(
            id, name, date, location,
            projects(name),
            event_types(name, color, needs_crew, needs_equipment)
          ),
          crew_roles(name)
        `)
        .gte('project_events.date', startDate)
        .lte('project_events.date', endDate)
        .neq('project_events.status', 'cancelled')
        .is('crew_member_id', null);

      if (error) throw error;

      return (unfilledRoleData || []).map(role => ({
        id: role.id,
        eventId: role.project_events.id,
        eventName: role.project_events.name,
        projectName: role.project_events.projects?.name || 'Unknown',
        date: role.project_events.date,
        roleName: role.crew_roles?.name || 'Unknown',
        eventType: role.project_events.event_types?.name || 'Unknown',
        eventTypeColor: role.project_events.event_types?.color || '#6B7280',
        location: role.project_events.location
      }));
    },
    enabled: true,
    staleTime: getCacheConfig(cacheStrategy, cacheResults).staleTime,
    gcTime: getCacheConfig(cacheStrategy, cacheResults).gcTime,
  });

  // ============================================================================
  // CONFLICT DETECTION - Extract overbooked crew
  // ============================================================================
  
  const conflicts = useMemo(() => {
    const conflictList: CrewConflict[] = [];
    
    rawAssignments.forEach((assignment, key) => {
      if (assignment.isOverbooked) {
        conflictList.push({
          crewMemberId: assignment.crewMemberId,
          crewMemberName: assignment.crewMemberName,
          date: assignment.date,
          conflictingAssignments: assignment.assignments.map(a => ({
            eventName: a.eventName,
            projectName: a.projectName,
            roleName: a.roleName
          })),
          assignmentCount: assignment.assignmentCount
        });
      }
    });
    
    return conflictList;
  }, [rawAssignments]);

  // ============================================================================
  // UNIVERSAL METHODS
  // ============================================================================

  const getAssignment = useMemo(() => 
    (crewId: string, date: string): CrewAssignment | null => {
      const key = `${crewId}-${date}`;
      return rawAssignments.get(key) || null;
    }, 
    [rawAssignments]
  );

  const isOverbooked = useMemo(() => 
    (crewId: string, date: string): boolean => {
      const assignment = getAssignment(crewId, date);
      return assignment?.isOverbooked || false;
    }, 
    [getAssignment]
  );

  const isAvailable = useMemo(() => 
    (crewId: string, date: string): boolean => {
      const assignment = getAssignment(crewId, date);
      return !assignment || assignment.assignmentCount === 0;
    }, 
    [getAssignment]
  );

  const getConflicts = useMemo(() => 
    (filters?: CrewConflictFilters): CrewConflict[] => {
      let filtered = conflicts;
      
      if (filters?.crewIds?.length) {
        filtered = filtered.filter(c => filters.crewIds!.includes(c.crewMemberId));
      }
      
      if (filters?.dates?.length) {
        filtered = filtered.filter(c => filters.dates!.includes(c.date));
      }
      
      if (filters?.minConflictCount) {
        filtered = filtered.filter(c => c.assignmentCount >= filters.minConflictCount!);
      }
      
      return filtered;
    }, 
    [conflicts]
  );

  const getUnfilledRolesFiltered = useMemo(() => 
    (filters?: UnfilledRoleFilters): UnfilledRole[] => {
      let filtered = unfilledRoles;
      
      if (filters?.eventIds?.length) {
        filtered = filtered.filter(r => filters.eventIds!.includes(r.eventId));
      }
      
      if (filters?.dates?.length) {
        filtered = filtered.filter(r => filters.dates!.includes(r.date));
      }
      
      if (filters?.roleNames?.length) {
        filtered = filtered.filter(r => filters.roleNames!.includes(r.roleName));
      }
      
      return filtered;
    }, 
    [unfilledRoles]
  );

  // ============================================================================
  // SUMMARY DATA
  // ============================================================================

  const totalConflicts = conflicts.length;
  const totalUnfilledRoles = unfilledRoles.length;
  const affectedCrewCount = new Set(conflicts.map(c => c.crewMemberId)).size;

  // ============================================================================
  // LOADING & ERROR STATE
  // ============================================================================

  const isLoading = isLoadingCrew || isLoadingAssignments || isLoadingUnfilled;
  const error = assignmentsError;

  return {
    // Core data
    crew,
    assignments: rawAssignments,
    
    // Conflicts & unfilled
    conflicts,
    unfilledRoles,
    
    // Date range
    startDate,
    endDate,
    
    // Summary
    totalConflicts,
    totalUnfilledRoles,
    affectedCrewCount,
    
    // Universal methods
    getAssignment,
    isOverbooked,
    isAvailable,
    getConflicts,
    getUnfilledRoles: getUnfilledRolesFiltered,
    
    // Status
    isLoading,
    error
  };
}

// =============================================================================
// OPTIMIZED WRAPPER HOOKS
// =============================================================================

/**
 * 🏠 DASHBOARD: Lightweight crew stats
 */
export function useDashboardCrewConflicts(selectedOwner?: string) {
  const { startDate, endDate } = getWarningTimeframe();
  
  const {
    conflicts,
    unfilledRoles,
    totalConflicts,
    totalUnfilledRoles,
    isLoading,
    error
  } = useCrewEngine({
    dateRange: { start: new Date(startDate), end: new Date(endDate) },
    cacheResults: true,
    cacheStrategy: 'dashboard'
  });

  return {
    conflictCount: totalConflicts,
    unfilledRoleCount: totalUnfilledRoles,
    conflicts,
    unfilledRoles,
    isLoading,
    error
  };
}

/**
 * 📅 TIMELINE: Optimized for timeline rendering
 */
export function useTimelineCrew(config: { start: Date; end: Date }) {
  return useCrewEngine({
    dateRange: config,
    cacheResults: true,
    cacheStrategy: 'timeline'
  });
}

/**
 * 📋 PROJECT: Project-specific crew data
 */
export function useProjectCrewConflicts(projectId: string) {
  const { startDate, endDate } = getWarningTimeframe();
  
  const {
    conflicts,
    unfilledRoles,
    getConflicts,
    getUnfilledRoles,
    isLoading,
    error
  } = useCrewEngine({
    dateRange: { start: new Date(startDate), end: new Date(endDate) },
    cacheResults: true,
    cacheStrategy: 'project'
  });

  // Filter to project-specific conflicts (we'll need project events for this)
  // For now, return all conflicts - can be enhanced later
  return {
    conflicts,
    unfilledRoles,
    getConflicts,
    getUnfilledRoles,
    isLoading,
    error
  };
}

/**
 * 🔍 GLOBAL SEARCH: Query-driven crew search
 */
export function useGlobalSearchCrew(query: string) {
  const { startDate, endDate } = getWarningTimeframe();
  
  return useCrewEngine({
    dateRange: { start: new Date(startDate), end: new Date(endDate) },
    cacheResults: true,
    cacheStrategy: 'search'
  });
}
