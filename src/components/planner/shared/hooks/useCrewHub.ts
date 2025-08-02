import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../../integrations/supabase/client';
import { usePersistentExpandedGroups } from '../../../../hooks/usePersistentExpandedGroups';
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
      console.log('🎬 Fetching crew data from Supabase...');
      
      // Simplified crew query to debug issues
      console.log('🔍 Fetching crew members...');
      const { data: crewMembers, error: crewError } = await supabase
        .from('crew_members')
        .select('id, name, email, phone, folder_id');

      if (crewError) {
        console.error('Error fetching crew:', crewError);
        throw crewError;
      }

      // Get folder names if needed
      const folderIds = [...new Set(crewMembers?.map(c => c.folder_id).filter(Boolean) || [])];
      let folderMap = new Map();
      
      if (folderIds.length > 0) {
        console.log('🔍 Fetching crew folders...');
        const { data: folders } = await supabase
          .from('crew_folders')
          .select('id, name')
          .in('id', folderIds);
        
        folders?.forEach(folder => {
          folderMap.set(folder.id, folder.name);
        });
      }

      // Transform database crew to our crew format
      const transformedCrew: CrewMember[] = (crewMembers || []).map(dbCrew => ({
        id: dbCrew.id,
        name: dbCrew.name,
        role: 'Crew Member', // Default role
        department: folderMap.get(dbCrew.folder_id) || 'Sonic', // Default to Sonic
        level: 'mid' as const,
        availability: 'available' as const,
        hourlyRate: 75,
        skills: [],
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
      
      // Debug: Let's see what data exists
      console.log('🔍 Debug: Checking project_event_roles table...');
      
      // First, let's see if there's ANY data in project_event_roles
      const { data: allRoles, error: allRolesError } = await supabase
        .from('project_event_roles')
        .select('id, crew_member_id, role_id, event_id, project_id')
        .limit(10);
        
      console.log('📊 Found project_event_roles:', allRoles?.length || 0, allRoles);
      
      if (allRolesError) {
        console.error('❌ Error querying project_event_roles:', allRolesError);
      }
      
      // Also check what project_events exist for our date range
      const { data: allEvents, error: eventsError } = await supabase
        .from('project_events')
        .select('id, name, date, project_id')
        .gte('date', periodStart.toISOString().split('T')[0])
        .lte('date', periodEnd.toISOString().split('T')[0])
        .limit(10);
        
      console.log('📅 Found project_events in date range:', allEvents?.length || 0, allEvents);
      
      // Now try a query with event types to get real colors
      console.log('📅 Fetching crew assignments for period:', periodStart.toISOString().split('T')[0], 'to', periodEnd.toISOString().split('T')[0]);
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
            event_type_id,
            projects(name),
            event_types(name, color)
          ),
          crew_members(name),
          crew_roles(name)
        `);

      if (assignmentsError) {
        console.error('❌ Error fetching assignments:', assignmentsError);
        // Return empty assignments if error, don't throw
        return { assignments: [] };
      }

      console.log('📊 Raw event roles data:', eventRoles?.length || 0, eventRoles);
      
      // Debug: Check if event types are being fetched
      if (eventRoles && eventRoles.length > 0) {
        const firstRole = eventRoles[0];
        console.log('🔍 Sample role structure:', {
          id: firstRole.id,
          crew_member_id: firstRole.crew_member_id,
          project_events: firstRole.project_events,
          hasEventTypes: !!firstRole.project_events?.event_types,
          eventTypeName: firstRole.project_events?.event_types?.name,
          eventTypeColor: firstRole.project_events?.event_types?.color
        });
      }
      
      // Filter for our date range after fetching
      const filteredRoles = (eventRoles || []).filter(role => {
        const eventDate = role.project_events?.date;
        if (!eventDate) return false;
        
        const startDate = periodStart.toISOString().split('T')[0];
        const endDate = periodEnd.toISOString().split('T')[0];
        
        return eventDate >= startDate && eventDate <= endDate;
      });
      
      console.log('📅 Filtered roles for date range:', filteredRoles.length);

      // Transform database assignments to our format with event type info
      const transformedAssignments: CrewAssignment[] = filteredRoles.map(dbRole => ({
        id: dbRole.id,
        crewMemberId: dbRole.crew_member_id || '',
        crewMemberName: dbRole.crew_members?.name || 'Unknown',
        role: dbRole.crew_roles?.name || 'Unknown Role',
        department: 'Unknown', // You might need to join more tables for department
        projectName: dbRole.project_events?.projects?.name || 'Unknown Project',
        eventName: dbRole.project_events?.name || 'Unknown Event',
        date: dbRole.project_events?.date || '',
        status: 'confirmed' as const, // People are either assigned or not - no "scheduled" state
        dailyRate: dbRole.daily_rate || undefined,
        eventType: dbRole.project_events?.event_types?.name || 'Unknown Type',
        eventTypeColor: dbRole.project_events?.event_types?.color || '#6B7280' // Use real event color or default gray
      }));

      console.log('✅ Final transformed assignments:', transformedAssignments.length, transformedAssignments);
      
      // Debug: Show event type colors
      if (transformedAssignments.length > 0) {
        const uniqueEventTypes = [...new Set(transformedAssignments.map(a => `${a.eventType}: ${a.eventTypeColor}`))];
        console.log('🎨 Event types and colors found:', uniqueEventTypes);
        
        // Show first assignment details
        const firstAssignment = transformedAssignments[0];
        console.log('🔍 First assignment details:', {
          eventName: firstAssignment.eventName,
          eventType: firstAssignment.eventType,
          eventTypeColor: firstAssignment.eventTypeColor,
          crewMemberName: firstAssignment.crewMemberName
        });
      }
      
      // FOR TESTING: If no real assignments, create some mock data
      if (transformedAssignments.length === 0 && crewData?.crewMembers?.length > 0) {
        console.log('🧪 No real assignments found, creating mock data for testing...');
        
        // Get first crew member for testing  
        const testCrewMember = crewData.crewMembers[0];
        if (testCrewMember) {
          const mockAssignments: CrewAssignment[] = [
            {
              id: 'mock-1',
              crewMemberId: testCrewMember.id,
              crewMemberName: testCrewMember.name,
              role: 'Sound Engineer',
              department: testCrewMember.department,
              projectName: 'Test Studio Session',
              eventName: 'Recording Day 1',
              date: periodStart.toISOString().split('T')[0], // Today
              status: 'confirmed',
              eventType: 'Studio Recording',
              eventTypeColor: '#3B82F6'
            },
            {
              id: 'mock-2', 
              crewMemberId: testCrewMember.id,
              crewMemberName: testCrewMember.name,
              role: 'Sound Engineer',
              department: testCrewMember.department,
              projectName: 'Test Live Show',
              eventName: 'Concert Setup',
              date: new Date(periodStart.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
              status: 'confirmed',
              eventType: 'Live Performance',
              eventTypeColor: '#EF4444'
            }
          ];
          
          console.log('🧪 Created mock assignments:', mockAssignments);
          return { assignments: mockAssignments };
        }
      }
      
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

  // Remove complex availability map - we'll query directly like equipment does

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
    
    console.log('🎨 Found crew assignments for timeline:', {
      crewMember: crewMember.name,
      date: dateStr,
      assignmentCount: crewAssignments.length,
      assignments: crewAssignments.map(a => ({
        eventName: a.eventName,
        eventType: a.eventType,
        eventTypeColor: a.eventTypeColor
      }))
    });
    
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

  const getProjectQuantityForDate = useCallback((projectName: string, crewMemberId: string, dateStr: string) => {
    const projectAssignments = crewProjectUsage.get(crewMemberId) || [];
    return projectAssignments.find(
      assignment => assignment.date === dateStr && assignment.projectName === projectName
    );
  }, [crewProjectUsage]);

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
    bookingsData: undefined, // Not needed with direct query approach
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