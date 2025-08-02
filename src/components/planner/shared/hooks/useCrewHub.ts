import { useState, useMemo, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../../integrations/supabase/client';
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

interface UseCrewHubProps {
  periodStart: Date;
  periodEnd: Date;
  selectedOwner?: string;
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
  selectedOwner
}: UseCrewHubProps): CrewHubReturn {
  
  // Expansion state management
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedEquipment, setExpandedEquipment] = useState<Set<string>>(new Set());
  const [conflicts, setConflicts] = useState<CrewConflict[]>([]);
  const [resolutionInProgress, setResolutionInProgress] = useState(false);

  // Fetch crew data from Supabase
  const { data: crewData, isLoading: isLoadingCrew } = useQuery({
    queryKey: ['crew-members', selectedOwner],
    queryFn: async () => {
      console.log('🎬 Fetching crew data from Supabase...');
      
      // Fetch crew members with their folders (simplified query)
      const { data: crewMembers, error: crewError } = await supabase
        .from('crew_members')
        .select(`
          id,
          name,
          email,
          phone,
          folder_id,
          crew_folders(name)
        `);

      if (crewError) {
        console.error('Error fetching crew:', crewError);
        throw crewError;
      }

      // Transform database crew to our crew format
      const transformedCrew: CrewMember[] = (crewMembers || []).map(dbCrew => ({
        id: dbCrew.id,
        name: dbCrew.name,
        role: 'Crew Member', // Default role - you could fetch from crew_member_roles separately
        department: dbCrew.crew_folders?.name || 'Unassigned',
        level: 'mid' as const, // Default level - you could add this to your DB
        availability: 'available' as const, // Default - you could add this to your DB
        hourlyRate: 75, // Default rate - you could add this to your DB
        skills: [], // You could add a skills table/field
        contactInfo: {
          email: dbCrew.email || undefined,
          phone: dbCrew.phone || undefined
        }
      }));

      console.log('📋 Found crew members:', transformedCrew.length);
      return { crewMembers: transformedCrew };
    },
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Fetch crew assignments from Supabase
  const { data: assignmentsData, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['crew-assignments', periodStart.toISOString(), periodEnd.toISOString(), selectedOwner],
    queryFn: async () => {
      console.log('📅 Fetching crew assignments from Supabase...');
      
      // Fetch crew assignments from project_event_roles table (simplified)
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
            projects(name)
          ),
          crew_members(name),
          crew_roles(name)
        `)
        .gte('project_events.date', periodStart.toISOString().split('T')[0])
        .lte('project_events.date', periodEnd.toISOString().split('T')[0]);

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError);
        // Return empty assignments if error, don't throw
        return { assignments: [] };
      }

      // Transform database assignments to our format
      const transformedAssignments: CrewAssignment[] = (eventRoles || []).map(dbRole => ({
        id: dbRole.id,
        crewMemberId: dbRole.crew_member_id || '',
        crewMemberName: dbRole.crew_members?.name || 'Unknown',
        role: dbRole.crew_roles?.name || 'Unknown Role',
        department: 'Unknown', // You might need to join more tables for department
        projectName: dbRole.project_events?.projects?.name || 'Unknown Project',
        eventName: dbRole.project_events?.name || 'Unknown Event',
        date: dbRole.project_events?.date || '',
        status: 'scheduled' as const, // You could add status to your DB
        dailyRate: dbRole.daily_rate || undefined
      }));

      console.log('📋 Found crew assignments:', transformedAssignments.length);
      return { assignments: transformedAssignments };
    },
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });

  // Transform crew members into groups by department
  const crewGroups: CrewGroup[] = useMemo(() => {
    if (!crewData?.crewMembers) return [];

    const groupsMap = new Map<string, CrewGroup>();
    
    crewData.crewMembers.forEach(crewMember => {
      const { department } = crewMember;
      
      if (!groupsMap.has(department)) {
        groupsMap.set(department, {
          mainFolder: department, // Use mainFolder for compatibility
          equipment: [], // Use equipment for compatibility (really crew members)
          subFolders: [], // Use subFolders for compatibility (really roles)
          isExpanded: expandedGroups.has(department)
        });
      }
      
      const group = groupsMap.get(department)!;
      group.equipment.push(crewMember); // Push to equipment array for compatibility
    });

    const groups = Array.from(groupsMap.values());
    const sortedGroups = sortCrewGroups(groups, DEPARTMENT_ORDER);
    
    // Sort crew members within each group
    sortedGroups.forEach(group => {
      group.equipment = group.equipment.sort((a, b) => a.name.localeCompare(b.name));
    });

    return sortedGroups;
  }, [crewData?.crewMembers, expandedGroups]);

  // Create crew member lookup map
  const crewById = useMemo(() => {
    const map = new Map<string, CrewMember>();
    crewData?.crewMembers?.forEach(member => {
      map.set(member.id, member);
    });
    return map;
  }, [crewData?.crewMembers]);

  // Transform assignments into availability data
  const availabilityData = useMemo(() => {
    if (!assignmentsData?.assignments || !crewData?.crewMembers) return undefined;

    const availabilityMap = new Map<string, CrewAvailability>();
    
    // Group assignments by crew member and date
    const assignmentsByCrewAndDate = new Map<string, CrewAssignment[]>();
    
    assignmentsData.assignments.forEach(assignment => {
      const key = `${assignment.crewMemberId}-${assignment.date}`;
      if (!assignmentsByCrewAndDate.has(key)) {
        assignmentsByCrewAndDate.set(key, []);
      }
      assignmentsByCrewAndDate.get(key)!.push(assignment);
    });

    // Create availability entries
    assignmentsByCrewAndDate.forEach((assignments, key) => {
      const [crewMemberId, date] = key.split('-');
      const crewMember = crewById.get(crewMemberId);
      
      if (crewMember) {
        const availability: CrewAvailability = {
          crewMemberId,
          crewMemberName: crewMember.name,
          date,
          department: crewMember.department,
          role: crewMember.role,
          assignments,
          totalAssignments: assignments.length,
          isOverbooked: assignments.length > 1, // Simple overbooking detection
          availability: assignments.length > 0 ? 'busy' : 'available'
        };
        
        availabilityMap.set(key, availability);
      }
    });

    return availabilityMap;
  }, [assignmentsData?.assignments, crewData?.crewMembers, crewById]);

  // Generate project usage data for expanded crew member view
  const crewProjectUsage = useMemo(() => {
    if (!assignmentsData?.assignments) return new Map();

    const usageMap = new Map<string, CrewProjectAssignment[]>();
    
    assignmentsData.assignments.forEach(assignment => {
      const projectAssignment: CrewProjectAssignment = {
        date: assignment.date,
        projectName: assignment.projectName,
        eventName: assignment.eventName,
        crewMemberId: assignment.crewMemberId,
        role: assignment.role,
        startTime: assignment.startTime,
        endTime: assignment.endTime,
        status: assignment.status
      };

      if (!usageMap.has(assignment.crewMemberId)) {
        usageMap.set(assignment.crewMemberId, []);
      }
      usageMap.get(assignment.crewMemberId)!.push(projectAssignment);
    });

    return usageMap;
  }, [assignmentsData?.assignments]);

  // Functions compatible with shared components
  const getBookingForEquipment = useCallback((crewMemberId: string, dateStr: string) => {
    const key = `${crewMemberId}-${dateStr}`;
    return availabilityData?.get(key);
  }, [availabilityData]);

  const getProjectQuantityForDate = useCallback((projectName: string, crewMemberId: string, dateStr: string) => {
    const projectAssignments = crewProjectUsage.get(crewMemberId) || [];
    return projectAssignments.find(
      assignment => assignment.date === dateStr && assignment.projectName === projectName
    );
  }, [crewProjectUsage]);

  const getLowestAvailable = useCallback((crewMemberId: string, dateStrings?: string[]) => {
    // For crew, this could represent availability score or assignment count
    // Simple implementation: return availability status as number
    const crewMember = crewById.get(crewMemberId);
    if (!crewMember) return 0;
    
    switch (crewMember.availability) {
      case 'available': return 1;
      case 'busy': return 0;
      case 'unavailable': return -1;
      case 'vacation': return -2;
      default: return 0;
    }
  }, [crewById]);

  const toggleGroup = useCallback((groupName: string, expandAllSubRoles?: boolean) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  }, []);

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
    console.log('Updating crew assignment state:', crewMemberId, dateStr, state);
  }, []);

  const getBookingState = useCallback((crewMemberId: string, dateStr: string) => {
    // Get crew assignment state
    return null;
  }, []);

  const batchUpdateBookings = useCallback((updates: any[]) => {
    // Batch update crew assignments
    console.log('Batch updating crew assignments:', updates);
  }, []);

  const clearStaleStates = useCallback(() => {
    // Clear stale crew assignment states
    console.log('Clearing stale crew states');
  }, []);

  const resolveConflict = useCallback((conflict: CrewConflict) => {
    // Resolve crew scheduling conflict
    console.log('Resolving crew conflict:', conflict);
    setResolutionInProgress(true);
    // Implement conflict resolution logic
    setTimeout(() => setResolutionInProgress(false), 1000);
  }, []);

  return {
    // Rename for compatibility with shared components
    equipmentGroups: crewGroups,
    equipmentById: crewById,
    bookingsData: availabilityData,
    conflicts,
    expandedGroups,
    expandedEquipment,
    equipmentProjectUsage: crewProjectUsage,
    isLoading: isLoadingCrew || isLoadingAssignments,
    isEquipmentReady: !isLoadingCrew,
    isBookingsReady: !isLoadingAssignments,
    resolutionInProgress,
    getBookingForEquipment,
    getProjectQuantityForDate,
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