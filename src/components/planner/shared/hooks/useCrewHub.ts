import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../../integrations/supabase/client';
import { usePersistentExpandedGroups } from '../../../../hooks/usePersistentExpandedGroups';
import { format } from 'date-fns';
import { 
  CrewGroup, 
  CrewMember, 
  CrewAssignment, 
  CrewAvailability,
  CrewConflict,
  CrewProjectAssignment,
  sortCrewGroups,
  DEPARTMENT_ORDER
} from '../types-crew';
import { CrewRoleCell } from '../components/ProjectRow';

interface UseCrewHubProps {
  periodStart: Date;
  periodEnd: Date;
  selectedOwner?: string;
  // Visible timeline boundaries for UI filtering
  visibleTimelineStart?: Date;
  visibleTimelineEnd?: Date;
  // Enable/disable flag to respect Rules of Hooks
  enabled?: boolean;
}

// Transform crew data to be compatible with shared UI components
interface CrewHubReturn {
  // Use equipment naming for compatibility with shared components
  equipmentGroups: CrewGroup[];
  equipmentById: Map<string, CrewMember>;
  bookingsData: Map<string, CrewAvailability> | undefined;
  conflicts: CrewConflict[];
  expandedGroups: Set<string>;
  expandedEquipment: Set<string>; // Really expanded crew members
  equipmentProjectUsage: Map<string, CrewProjectAssignment[]>; // Really crew project assignments
  isLoading: boolean;
  isEquipmentReady: boolean; // Really isCrewReady
  isBookingsReady: boolean; // Really isAssignmentsReady
  resolutionInProgress: boolean;
  
  // Function interfaces compatible with shared components
  getBookingForEquipment: (crewMemberId: string, dateStr: string) => CrewAvailability | undefined;
  getProjectQuantityForDate: (projectName: string, crewMemberId: string, dateStr: string) => CrewProjectAssignment | undefined;
  getCrewRoleForDate: (projectName: string, crewMemberId: string, dateStr: string) => CrewRoleCell | undefined;
  getLowestAvailable: (crewMemberId: string, dateStrings?: string[]) => number;
  toggleGroup: (groupName: string, expandAllSubRoles?: boolean) => void;
  toggleEquipmentExpansion: (crewMemberId: string) => void;
  updateBookingState: (crewMemberId: string, dateStr: string, state: any) => void;
  getBookingState: (crewMemberId: string, dateStr: string) => any;
  batchUpdateBookings: (updates: any[]) => void;
  clearStaleStates: () => void;
  resolveConflict: (conflict: CrewConflict) => void;
}

export function useCrewHub({
  periodStart,
  periodEnd,
  selectedOwner,
  visibleTimelineStart,
  visibleTimelineEnd,
  enabled = true
}: UseCrewHubProps): CrewHubReturn {
  
  // Persistent expansion state management for crew
  const {
    expandedGroups,
    toggleGroup: toggleGroupPersistent,
    initializeDefaultExpansion
  } = usePersistentExpandedGroups('crewPlannerExpandedGroups');
  const [expandedEquipment, setExpandedEquipment] = useState<Set<string>>(new Set());
  const [conflicts, setConflicts] = useState<CrewConflict[]>([]);
  const [resolutionInProgress, setResolutionInProgress] = useState(false);

  // Fetch crew data from Supabase
  const { data: crewData, isLoading: isLoadingCrew } = useQuery({
    queryKey: ['crew-members', selectedOwner],
    queryFn: async () => {
      const { data: crewMembers, error: crewError } = await supabase
        .from('crew_members')
        .select('id, name, email, phone, folder_id, avatar_url');

      if (crewError) {
        console.error('Error fetching crew:', crewError);
        throw crewError;
      }

      // Fetch all crew member roles and crew roles in separate queries
      const [crewMemberRolesResult, crewRolesResult, foldersResult] = await Promise.all([
        supabase.from('crew_member_roles').select('*'),
        supabase.from('crew_roles').select('*'),
        Promise.resolve({ data: [] }) // Will fetch folders below if needed
      ]);

      if (crewMemberRolesResult.error) {
        console.error('Error fetching crew member roles:', crewMemberRolesResult.error);
      }
      if (crewRolesResult.error) {
        console.error('Error fetching crew roles:', crewRolesResult.error);
      }

      // Create lookup maps for roles
      const roleIdToName = new Map(
        (crewRolesResult.data || []).map(role => [role.id, role.name])
      );
      
      const memberIdToRoles = new Map<string, string[]>();
      (crewMemberRolesResult.data || []).forEach(cmr => {
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

      // Get folder names if needed
      const folderIds = [...new Set(crewMembers?.map(c => c.folder_id).filter(Boolean) || [])];
      let folderMap = new Map();
      
      if (folderIds.length > 0) {
        const { data: folders } = await supabase
          .from('crew_folders')
          .select('id, name')
          .in('id', folderIds);
        
        folders?.forEach(folder => {
          folderMap.set(folder.id, folder.name);
        });
      }

      // Transform database crew to our crew format
      const transformedCrew: CrewMember[] = (crewMembers || []).map(dbCrew => {
        const memberRoles = memberIdToRoles.get(dbCrew.id) || [];
        return {
          id: dbCrew.id,
          name: dbCrew.name,
          role: memberRoles.length > 0 ? memberRoles[0] : 'Crew Member', // Use first role or default
          roles: memberRoles, // Add roles array for filtering
          department: folderMap.get(dbCrew.folder_id) || 'Sonic City', // Default to Sonic City
          level: 'mid' as const,
          availability: 'available' as const,
          hourlyRate: 75,
          skills: [],
          contactInfo: {
            email: dbCrew.email || undefined,
            phone: dbCrew.phone || undefined
          },
          // Avatar support - use actual avatar_url from Google Auth
          avatarUrl: dbCrew.avatar_url || undefined
        };
      });

      return { crewMembers: transformedCrew };
    },
    enabled, // Only fetch when enabled
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Fetch crew assignments from Supabase
  const { data: assignmentsData, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['crew-assignments', periodStart.toISOString(), periodEnd.toISOString(), selectedOwner],
    queryFn: async () => {

      const { data: eventRoles, error: assignmentsError } = await supabase
        .from('project_event_roles')
        .select(`
          id,
          crew_member_id,
          role_id,
          daily_rate,
          hourly_rate,
          project_events(
            name,
            date,
            location,
            event_type_id,
            projects(name),
            event_types(name, color)
          ),
          crew_members(name),
          crew_roles(name)
        `)
        .gte('project_events.date', periodStart.toISOString().split('T')[0])
        .lte('project_events.date', periodEnd.toISOString().split('T')[0]);

      if (assignmentsError) {
        console.error('Error fetching crew assignments:', assignmentsError);
        return { assignments: [], unfilledRoles: [] };
      }

      // Transform database assignments to our format
      const transformedAssignments: CrewAssignment[] = (eventRoles || []).map(dbRole => ({
        id: dbRole.id,
        crewMemberId: dbRole.crew_member_id || '',
        crewMemberName: dbRole.crew_members?.name || 'Unknown',
        role: dbRole.crew_roles?.name || 'Unknown Role',
        department: 'Unknown',
        projectName: dbRole.project_events?.projects?.name || 'Unknown Project',
        eventName: dbRole.project_events?.name || 'Unknown Event',
        date: dbRole.project_events?.date || '',
        status: 'confirmed' as const,
        dailyRate: dbRole.daily_rate || undefined,
        eventType: dbRole.project_events?.event_types?.name || 'Unknown Type',
        eventTypeColor: dbRole.project_events?.event_types?.color || '#6B7280',
        location: dbRole.project_events?.location || undefined
      }));

      // Fetch unfilled roles (roles without crew_member_id)
      const { data: unfilledEventRoles } = await supabase
        .from('project_event_roles')
        .select(`
          id,
          role_id,
          daily_rate,
          hourly_rate,
          project_events!inner(
            name,
            date,
            event_type_id,
            projects(name),
            event_types(name, color)
          ),
          crew_roles(name)
        `)
        .is('crew_member_id', null)
        .gte('project_events.date', periodStart.toISOString().split('T')[0])
        .lte('project_events.date', periodEnd.toISOString().split('T')[0]);

      // Transform unfilled roles
      const unfilledRoles = (unfilledEventRoles || []).map(dbRole => ({
        id: `unfilled-${dbRole.id}`,
        name: `${dbRole.crew_roles?.name || 'Unknown Role'} - ${dbRole.project_events?.name}`,
        role: dbRole.crew_roles?.name || 'Unknown Role',
        department: 'Unfilled Roles',
        level: 'mid' as const,
        availability: 'needed' as const,
        hourlyRate: 0,
        skills: [],
        contactInfo: {},
        eventName: dbRole.project_events?.name || 'Unknown Event',
        projectName: dbRole.project_events?.projects?.name || 'Unknown Project',
        date: dbRole.project_events?.date || '',
        eventType: dbRole.project_events?.event_types?.name || 'Unknown Type',
        eventTypeColor: dbRole.project_events?.event_types?.color || '#EF4444',
        dailyRate: dbRole.daily_rate,
        // Avatar support for unfilled roles - no avatar URL
        avatarUrl: undefined
      }));

      return { assignments: transformedAssignments, unfilledRoles };
    },
    enabled: enabled && !!crewData, // Only fetch when enabled and crew data is available
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });

  // Transform crew members into groups by department, including unfilled roles
  const crewGroups: CrewGroup[] = useMemo(() => {
    if (!crewData?.crewMembers && !assignmentsData?.unfilledRoles) return [];

    const groupsMap = new Map<string, CrewGroup>();
    
    // Add regular crew members
    (crewData?.crewMembers || []).forEach(crewMember => {
      const { department } = crewMember;
      
      if (!groupsMap.has(department)) {
        groupsMap.set(department, {
          mainFolder: department,
          equipment: [], // Use equipment for compatibility (really crew members)
          subFolders: [],
          isExpanded: expandedGroups.has(department)
        });
      }
      
      const group = groupsMap.get(department)!;
      group.equipment.push(crewMember);
    });

    // Add unfilled roles as a separate group with role-based subfolders
    if (assignmentsData?.unfilledRoles && assignmentsData.unfilledRoles.length > 0) {
      // Group unfilled roles by role type
      const roleGroups = new Map<string, any[]>();
      assignmentsData.unfilledRoles.forEach(role => {
        if (!roleGroups.has(role.role)) {
          roleGroups.set(role.role, []);
        }
        roleGroups.get(role.role)!.push(role);
      });

      // Create subfolders for each role type
      const subFolders = Array.from(roleGroups.entries()).map(([roleName, roles]) => ({
        name: roleName,
        equipment: roles,
        isExpanded: expandedGroups.has(`Unfilled Roles/${roleName}`)
      }));

      // Sort subfolders by role name
      subFolders.sort((a, b) => a.name.localeCompare(b.name));

      groupsMap.set('Unfilled Roles', {
        mainFolder: 'Unfilled Roles',
        equipment: [], // No equipment at main level, all in subfolders
        subFolders,
        isExpanded: expandedGroups.has('Unfilled Roles'),
        isUnfilledRolesSection: true // Mark this section for special handling
      });
    }

    const groups = Array.from(groupsMap.values());
    const sortedGroups = sortCrewGroups(groups, DEPARTMENT_ORDER);
    
    // Sort crew members within each group
    sortedGroups.forEach(group => {
      group.equipment = group.equipment.sort((a, b) => a.name.localeCompare(b.name));
    });

    return sortedGroups;
  }, [crewData?.crewMembers, assignmentsData?.unfilledRoles, expandedGroups]);

  // Create crew member lookup map
  const crewById = useMemo(() => {
    const map = new Map<string, CrewMember>();
    crewData?.crewMembers?.forEach(member => {
      map.set(member.id, member);
    });
    return map;
  }, [crewData?.crewMembers]);

  // Remove complex availability map - we'll query directly like equipment does

  // Smart project usage - only shows projects within visible timeline range
  const crewProjectUsage = useMemo(() => {
    if (!assignmentsData?.assignments) return new Map();

    // Use visible timeline boundaries if provided, otherwise fall back to data boundaries
    const timelineStart = visibleTimelineStart 
      ? visibleTimelineStart.toISOString().split('T')[0]
      : periodStart.toISOString().split('T')[0];
    const timelineEnd = visibleTimelineEnd 
      ? visibleTimelineEnd.toISOString().split('T')[0]
      : periodEnd.toISOString().split('T')[0];

    const filteredAssignments = assignmentsData.assignments.filter(a => a.date >= timelineStart && a.date <= timelineEnd);

    const projectsByCrewMember = new Map<string, Set<string>>();
    
    // Only include assignments within visible timeline range
    filteredAssignments.forEach(assignment => {
        if (!projectsByCrewMember.has(assignment.crewMemberId)) {
          projectsByCrewMember.set(assignment.crewMemberId, new Set());
        }
        projectsByCrewMember.get(assignment.crewMemberId)!.add(assignment.projectName);
      });

    // Convert to expected format
    const usageMap = new Map<string, { projectNames: string[] }>();
    projectsByCrewMember.forEach((projectSet, crewMemberId) => {
      const projectNames = Array.from(projectSet).sort();
      usageMap.set(crewMemberId, { projectNames });
    });

    return usageMap;
  }, [
    assignmentsData?.assignments,
    visibleTimelineStart?.getTime(), // Use timestamp for more stable dependency
    visibleTimelineEnd?.getTime(),
    periodStart.getTime(),
    periodEnd.getTime()
  ]);

  // Stable function with memoized results per call
  const getProjectQuantityForDate = useCallback((projectName: string, crewMemberId: string, dateStr: string) => {
    const cacheKey = `${crewMemberId}-${projectName}-${dateStr}`;
    
    const crewAssignments = assignmentsData?.assignments?.filter(
      assignment => assignment.crewMemberId === crewMemberId && 
                   assignment.projectName === projectName && 
                   assignment.date === dateStr
    ) || [];

    if (crewAssignments.length === 0) return undefined;

    const assignment = crewAssignments[0];
    return {
      projectName: assignment.projectName,
      eventName: assignment.eventName,
      eventType: assignment.eventType,
      eventTypeColor: assignment.eventTypeColor,
      quantity: crewAssignments.length,
      used: crewAssignments.length,
      available: 1,
      isOverbooked: crewAssignments.length > 1
    };
  }, [assignmentsData?.assignments]);

  // Function to get crew role for a specific project and date
  const getCrewRoleForDate = useCallback((projectName: string, crewMemberId: string, dateStr: string): CrewRoleCell | undefined => {
    const crewAssignments = assignmentsData?.assignments?.filter(
      assignment => assignment.crewMemberId === crewMemberId && 
                   assignment.projectName === projectName && 
                   assignment.date === dateStr
    ) || [];

    if (crewAssignments.length === 0) return undefined;

    const assignment = crewAssignments[0];
    return {
      date: dateStr,
      role: assignment.role,
      eventName: assignment.eventName,
      projectName: assignment.projectName,
      location: assignment.location,
      eventType: assignment.eventType
    };
  }, [assignmentsData?.assignments]);

  // Direct database query approach - like equipment does it
  const getBookingForEquipment = useCallback((crewMemberId: string, dateStr: string) => {
    if (!assignmentsData?.assignments) return undefined;
    
    // Find assignments for this crew member on this date - direct lookup
    const crewAssignments = assignmentsData.assignments.filter(
      assignment => assignment.crewMemberId === crewMemberId && assignment.date === dateStr
    );
    
    if (crewAssignments.length === 0) return undefined;
    
    // Get crew member info
    const crewMember = crewById.get(crewMemberId);
    if (!crewMember) return undefined;
    
    // Return in equipment-compatible format
    return {
      equipmentId: crewMemberId,
      equipmentName: crewMember.name,
      stock: 1, // Crew members have availability, not stock
      date: dateStr,
      folderPath: crewMember.department,
      bookings: crewAssignments, // Contains the assignments with event colors
      totalUsed: crewAssignments.length,
      isOverbooked: crewAssignments.length > 1, // Crew conflict
    };
  }, [assignmentsData?.assignments, crewById]);

  const getLowestAvailable = useCallback((crewMemberId: string, dateStrings?: string[]) => {
    // For crew, return binary availability: 1 = available, 0 = busy
    // Check if crew member has any assignments in the given date range
    if (!dateStrings || dateStrings.length === 0) {
      const crewMember = crewById.get(crewMemberId);
      if (!crewMember) return 0;
      return crewMember.availability === 'available' ? 1 : 0;
    }
    
    // Check specific dates for assignments using direct query approach
    const hasAnyAssignments = dateStrings.some(dateStr => {
      if (!assignmentsData?.assignments) return false;
      
      // Find assignments for this crew member on this date
      const crewAssignments = assignmentsData.assignments.filter(
        assignment => assignment.crewMemberId === crewMemberId && assignment.date === dateStr
      );
      
      return crewAssignments.length > 0;
    });
    
    return hasAnyAssignments ? 0 : 1; // 0 = busy, 1 = available
  }, [crewById, assignmentsData?.assignments]);

  // Enhanced toggle group with subfolder support (similar to equipment)
  const toggleGroup = useCallback((groupName: string, expandAllSubRoles?: boolean) => {
    if (expandAllSubRoles) {
      const group = crewGroups.find(g => g.mainFolder === groupName);
      const subFolderKeys = group?.subFolders?.map(
        (subFolder) => `${groupName}/${subFolder.name}`
      ) || [];
      
      toggleGroupPersistent(groupName, expandAllSubRoles, subFolderKeys);
    } else {
      toggleGroupPersistent(groupName, false);
    }
  }, [crewGroups, toggleGroupPersistent]);

  // Initialize default expanded state for crew folders
  useEffect(() => {
    if (crewGroups.length > 0) {
      const mainFolders = crewGroups.map(g => g.mainFolder);
      initializeDefaultExpansion(mainFolders);
    }
  }, [crewGroups, initializeDefaultExpansion]);

  const toggleEquipmentExpansion = useCallback((crewMemberId: string) => {
    setExpandedEquipment(prev => {
      const newSet = new Set(prev);
      if (newSet.has(crewMemberId)) {
        newSet.delete(crewMemberId);
      } else {
        newSet.add(crewMemberId);
      }
      return newSet;
    });
  }, []);

  // Placeholder functions for state management
  const updateBookingState = useCallback((crewMemberId: string, dateStr: string, state: any) => {
    // Implement crew assignment state updates
    // Update crew assignment state
  }, []);

  const getBookingState = useCallback((crewMemberId: string, dateStr: string) => {
    // Get crew assignment state
    return null;
  }, []);

  const batchUpdateBookings = useCallback((updates: any[]) => {
    // Batch update crew assignments
  }, []);

  const clearStaleStates = useCallback(() => {
    // Clear stale crew assignment states
  }, []);

  const resolveConflict = useCallback((conflict: CrewConflict) => {
    // Resolve crew scheduling conflict
    setResolutionInProgress(true);
    setTimeout(() => setResolutionInProgress(false), 1000);
  }, []);

  return {
    // Rename for compatibility with shared components
    equipmentGroups: crewGroups,
    equipmentById: crewById,
    bookingsData: undefined, // Not needed with direct query approach
    conflicts,
    expandedGroups,
    expandedEquipment,
    equipmentProjectUsage: crewProjectUsage, // Renamed for interface compatibility
    isLoading: isLoadingCrew || isLoadingAssignments,
    isEquipmentReady: !isLoadingCrew,
    isBookingsReady: !isLoadingAssignments,
    resolutionInProgress,
    getBookingForEquipment,
    getProjectQuantityForDate,
    getCrewRoleForDate, // New function for crew role data
    getLowestAvailable,
    toggleGroup,
    toggleEquipmentExpansion,
    updateBookingState,
    getBookingState,
    batchUpdateBookings,
    clearStaleStates,
    resolveConflict,
  };
}