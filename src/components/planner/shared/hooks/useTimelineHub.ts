/**
 * UNIFIED TIMELINE HUB
 * 
 * Single hook that handles ALL timeline data needs:
 * - Equipment OR Crew data (resource-agnostic)
 * - Bookings/Assignments with proper caching
 * - Project rows with scroll-aware rendering
 * - Warning/conflict detection (30-day window)
 * - Expansion state management
 * - Optimized for infinite scroll
 * 
 * Senior Engineer Approach: Simple, Direct, Performant
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { OVERBOOKING_WARNING_DAYS, getWarningTimeframe } from '@/constants/timeframes';
import { usePersistentExpandedGroups } from '@/hooks/ui';
import { FOLDER_ORDER, SUBFOLDER_ORDER } from '@/types/equipment';
import { PERFORMANCE } from '../constants';
import { useSubrentalSuggestions } from '@/hooks/equipment/useSubrentalSuggestions';

interface UseTimelineHubProps {
  resourceType: 'equipment' | 'crew';
  periodStart: Date;
  periodEnd: Date;
  selectedOwner?: string;
  visibleTimelineStart?: Date;
  visibleTimelineEnd?: Date;
  enabled?: boolean;
}

export function useTimelineHub({
  resourceType,
  periodStart,
  periodEnd,
  selectedOwner,
  visibleTimelineStart,
  visibleTimelineEnd,
  enabled = true
}: UseTimelineHubProps) {

  // SIMPLE DATA RANGE - No sliding window complexity
  const stableDataRange = useMemo(() => {
    // Simple: timeline range + 1 week buffer on each side
    const bufferDays = 7;
    const start = new Date(periodStart.getTime() - bufferDays * 24 * 60 * 60 * 1000);
    const end = new Date(periodEnd.getTime() + bufferDays * 24 * 60 * 60 * 1000);
    
    return { start, end };
  }, [
    // Simple weekly boundaries for stable caching
    Math.floor(periodStart.getTime() / (7 * 24 * 60 * 60 * 1000)), 
    Math.floor(periodEnd.getTime() / (7 * 24 * 60 * 60 * 1000))
  ]);

  // EXPANSION STATE
  const storageKey = resourceType === 'equipment' ? 'equipmentPlannerExpandedGroups' : 'crewPlannerExpandedGroups';
  const {
    expandedGroups,
    toggleGroup: toggleGroupPersistent,
    initializeDefaultExpansion,
    setExpandedGroups
  } = usePersistentExpandedGroups(storageKey);
  
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set());

  // FETCH FUNCTIONS - Must be defined before use
  const fetchEquipmentData = useCallback(async () => {
    const [equipmentResult, foldersResult] = await Promise.all([
      supabase.from('equipment').select('id, name, stock, folder_id'),
      supabase.from('equipment_folders').select('*')
    ]);

    if (equipmentResult.error) throw equipmentResult.error;
    if (foldersResult.error) throw foldersResult.error;

    const folderMap = new Map(foldersResult.data?.map(f => [f.id, f]) || []);
    const resources = [];
    const resourceById = new Map();

    // Folders loaded from database (debug logging removed)

    equipmentResult.data?.forEach(eq => {
      const folder = folderMap.get(eq.folder_id);
      const parentFolder = folder?.parent_id ? folderMap.get(folder.parent_id) : null;
      
      const mainFolder = parentFolder?.name || folder?.name || 'Uncategorized';
      const subFolder = folder?.parent_id ? folder.name : undefined;
      const folderPath = subFolder ? `${mainFolder}/${subFolder}` : mainFolder;

      // Folder derivation logic (debug logging removed)

      const resource = {
        id: eq.id,
        name: eq.name,
        stock: eq.stock || 0,
        folderPath,
        mainFolder,
        subFolder,
        level: subFolder ? 2 : 1
      };

      resources.push(resource);
      resourceById.set(eq.id, resource);
    });

    return { resources, resourceById };
  }, []);

  const fetchCrewData = useCallback(async () => {
    const [crewResult, memberRolesResult, crewRolesResult, foldersResult] = await Promise.all([
      supabase.from('crew_members').select('id, name, email, phone, folder_id, avatar_url'),
      supabase.from('crew_member_roles').select('*'),
      supabase.from('crew_roles').select('*'),
      supabase.from('crew_folders').select('id, name')
    ]);

    if (crewResult.error) throw crewResult.error;
    if (memberRolesResult.error) throw memberRolesResult.error;
    if (crewRolesResult.error) throw crewRolesResult.error;
    if (foldersResult.error) throw foldersResult.error;

    // Role mappings
    const roleIdToName = new Map(crewRolesResult.data?.map(role => [role.id, role.name]) || []);
    const memberIdToRoles = new Map();
    
    // Folder mappings
    const folderIdToName = new Map(foldersResult.data?.map(folder => [folder.id, folder.name]) || []);
    
    memberRolesResult.data?.forEach(cmr => {
      if (cmr.crew_member_id && cmr.role_id) {
        const roleName = roleIdToName.get(cmr.role_id);
        if (roleName) {
          if (!memberIdToRoles.has(cmr.crew_member_id)) {
            memberIdToRoles.set(cmr.crew_member_id, []);
          }
          memberIdToRoles.get(cmr.crew_member_id).push(roleName);
        }
      }
    });

    const resources = [];
    const resourceById = new Map();

    crewResult.data?.forEach(crew => {
      const memberRoles = memberIdToRoles.get(crew.id) || [];
      const folderName = folderIdToName.get(crew.folder_id) || 'Unassigned';
      const resource = {
        id: crew.id,
        name: crew.name,
        role: memberRoles[0] || 'Crew Member',
        roles: memberRoles,
        department: folderName,
        level: 'mid',
        availability: 'available',
        hourlyRate: 75,
        skills: [],
        contactInfo: {
          email: crew.email,
          phone: crew.phone
        },
        avatarUrl: crew.avatar_url,
        mainFolder: folderName, // Use actual folder name for grouping
        folderPath: folderName
      };

      resources.push(resource);
      resourceById.set(crew.id, resource);
    });

    return { resources, resourceById };
  }, []);

  const fetchEquipmentBookings = useCallback(async (expandedIds: string[]) => {
    const dateStart = format(stableDataRange.start, 'yyyy-MM-dd');
    const dateEnd = format(stableDataRange.end, 'yyyy-MM-dd');
    
    // Get events
    let eventsQuery = supabase
      .from('project_events')
      .select(`
        id, date, name, project_id,
        project:projects!inner (name, owner_id)
      `)
      .gte('date', dateStart)
      .lte('date', dateEnd);

    if (selectedOwner) {
      eventsQuery = eventsQuery.eq('project.owner_id', selectedOwner);
    }

    const { data: events, error: eventsError } = await eventsQuery;
    if (eventsError) throw eventsError;
    if (!events?.length) return new Map();

    // Smart folder: Only fetch if equipment is expanded
    if (expandedIds.length === 0) {
      return new Map(); // No expanded folders = no bookings needed
    }

    // Get equipment bookings - FILTERED to expanded equipment only
    let equipmentQuery = supabase
      .from('project_event_equipment')
      .select('event_id, equipment_id, quantity')
      .in('event_id', events.map(e => e.id));

    // Apply equipment ID filter for expanded folders only
    if (expandedIds.length > 0) {
      equipmentQuery = equipmentQuery.in('equipment_id', expandedIds);
    }

    const { data: equipmentBookings, error: equipmentError } = await equipmentQuery;
    if (equipmentError) throw equipmentError;

    // Simplified logging
    if (process.env.NODE_ENV === 'development' && equipmentBookings?.length) {
      // Bookings loaded successfully (logging removed)
    }

    // Transform to booking map
    const eventMap = new Map(events.map(e => [e.id, e]));
    const bookingsByKey = new Map();
    
    equipmentBookings?.forEach(booking => {
      const event = eventMap.get(booking.event_id);
      if (!event) return;
      
      const key = `${booking.equipment_id}-${event.date}`;
      
      if (!bookingsByKey.has(key)) {
        bookingsByKey.set(key, {
          resourceId: booking.equipment_id,
          resourceName: 'Unknown', // Will be set in processing step
          date: event.date,
          stock: 0, // Will be set in processing step
          bookings: [],
          totalUsed: 0,
          isOverbooked: false,
          folderPath: 'Uncategorized' // Will be set in processing step
        });
      }
      
      const bookingData = bookingsByKey.get(key);
      bookingData.bookings.push({
        quantity: booking.quantity || 0,
        projectName: event.project.name,
        eventName: event.name
      });
      bookingData.totalUsed += booking.quantity || 0;
      // isOverbooked will be calculated in processing step when we have stock info
    });

    return bookingsByKey;
  }, [stableDataRange, selectedOwner]);

  const fetchCrewAssignments = useCallback(async () => {
    const dateStart = format(stableDataRange.start, 'yyyy-MM-dd');
    const dateEnd = format(stableDataRange.end, 'yyyy-MM-dd');

    const { data: eventRoles, error } = await supabase
      .from('project_event_roles')
      .select(`
        id, crew_member_id, role_id, daily_rate, hourly_rate,
        project_events(name, date, location, projects(name), event_types(name, color)),
        crew_members(name),
        crew_roles(name)
      `)
      .gte('project_events.date', dateStart)
      .lte('project_events.date', dateEnd);

    if (error) throw error;

    const assignmentsByKey = new Map();
    
    eventRoles?.forEach(role => {
      if (!role.crew_member_id || !role.project_events) return;
      
      const key = `${role.crew_member_id}-${role.project_events.date}`;
      
      if (!assignmentsByKey.has(key)) {
        assignmentsByKey.set(key, {
          resourceId: role.crew_member_id,
          resourceName: 'Unknown', // Will be set in processing step
          date: role.project_events.date,
          department: 'Unknown', // Will be set in processing step
          assignments: [],
          totalAssignments: 0,
          isOverbooked: false
        });
      }
      
      const assignment = assignmentsByKey.get(key);
      const eventTypeColor = role.project_events.event_types?.color || '#6B7280';
      const eventTypeName = role.project_events.event_types?.name || 'Unknown';
      
      assignment.assignments.push({
        id: role.id,
        role: role.crew_roles?.name || 'Unknown',
        projectName: role.project_events.projects?.name || 'Unknown',
        eventName: role.project_events.name || 'Unknown',
        dailyRate: role.daily_rate,
        eventType: eventTypeName,
        eventTypeColor: eventTypeColor,
        location: role.project_events.location
      });
      assignment.totalAssignments = assignment.assignments.length;
      assignment.isOverbooked = assignment.totalAssignments > 1;
    });

    return assignmentsByKey;
  }, [stableDataRange]);

  // RESOURCE DATA (Equipment or Crew)
  const { data: resourceData, isLoading: isLoadingResources } = useQuery({
    queryKey: [`timeline-${resourceType}`, selectedOwner],
    queryFn: resourceType === 'equipment' ? fetchEquipmentData : fetchCrewData,
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // EARLY CALCULATION: Get expanded equipment IDs before booking fetch for smart optimization
  const expandedEquipmentIds = useMemo(() => {
    if (!resourceData?.resources) return [];
    
    const expandedIds: string[] = [];
    const groupsMap = new Map();
    
    // Build groups structure first
    resourceData.resources.forEach(resource => {
      const { mainFolder, subFolder } = resource;
      
      if (!groupsMap.has(mainFolder)) {
        groupsMap.set(mainFolder, {
          mainFolder,
          equipment: [],
          subFolders: [],
          isExpanded: expandedGroups.has(mainFolder)
        });
      }
      
      const group = groupsMap.get(mainFolder);
      
      if (subFolder) {
        let subFolderObj = group.subFolders.find(sf => sf.name === subFolder);
        if (!subFolderObj) {
          subFolderObj = {
            name: subFolder,
            mainFolder,
            equipment: [],
            isExpanded: expandedGroups.has(`${mainFolder}/${subFolder}`)
          };
          group.subFolders.push(subFolderObj);
        }
        subFolderObj.equipment.push(resource);
      } else {
        group.equipment.push(resource);
      }
    });
    
    // Extract IDs from expanded folders
    Array.from(groupsMap.values()).forEach(group => {
      if (group.isExpanded) {
        // Add equipment from expanded main folders
        group.equipment.forEach(equipment => {
          expandedIds.push(equipment.id);
        });
        
        // Add equipment from expanded subfolders
        group.subFolders.forEach(subFolder => {
          if (subFolder.isExpanded) {
            subFolder.equipment.forEach(equipment => {
              expandedIds.push(equipment.id);
            });
          }
        });
      }
    });
    
    // Track expansion state (logging removed)
    
    return expandedIds;
  }, [resourceData?.resources, expandedGroups]);

  // SIMPLIFIED BOOKING DATA - Stable query with longer cache times
  const { data: rawBookingsData, isLoading: isLoadingBookings } = useQuery({
    queryKey: [
      `timeline-${resourceType}-bookings`,
      format(stableDataRange.start, 'yyyy-MM-dd'),
      format(stableDataRange.end, 'yyyy-MM-dd'),
      selectedOwner,
      // Stable expanded equipment key - only changes when folders expand/collapse
      expandedEquipmentIds.length > 0 ? expandedEquipmentIds.sort().join(',') : 'none'
    ],
    queryFn: () => resourceType === 'equipment' 
      ? fetchEquipmentBookings(expandedEquipmentIds) 
      : fetchCrewAssignments(),
    enabled: enabled && (resourceType === 'crew' || expandedEquipmentIds.length > 0),
    staleTime: 5 * 60 * 1000, // 5 minutes - longer cache
    gcTime: 15 * 60 * 1000, // 15 minutes - keep in memory longer
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  // PROCESS BOOKING DATA - Memoized to prevent recalculation flashing
  const bookingsData = useMemo(() => {
    if (!rawBookingsData || !resourceData?.resourceById) return rawBookingsData;
    
    // Add stock info from resource data
    const processedBookings = new Map();
    
    rawBookingsData.forEach((booking, key) => {
      const resource = resourceData.resourceById.get(booking.resourceId);
      const processedBooking = { ...booking };
      
      if (resourceType === 'equipment' && resource) {
        processedBooking.stock = resource.stock || 0;
        processedBooking.isOverbooked = processedBooking.totalUsed > processedBooking.stock;
        processedBooking.resourceName = resource.name;
        processedBooking.folderPath = resource.folderPath;
      } else if (resourceType === 'crew' && resource) {
        processedBooking.resourceName = resource.name;
        processedBooking.department = resource.department;
        // CRITICAL: Ensure crew assignments are available as 'bookings' for UI compatibility
        processedBooking.bookings = processedBooking.assignments || [];
      }
      
      processedBookings.set(key, processedBooking);
    });
    
    return processedBookings;
  }, [rawBookingsData, resourceData?.resourceById, resourceType]);

  // WARNINGS (30-day window)
  const warnings = useMemo(() => {
    if (!bookingsData || !resourceData) return [];
    
    const today = new Date();
    const warningEnd = addDays(today, OVERBOOKING_WARNING_DAYS);
    
    const warningsList = [];
    
    Array.from(bookingsData.values()).forEach(booking => {
      const bookingDate = new Date(booking.date);
      if (bookingDate < today || bookingDate > warningEnd) return;
      
      const resource = resourceData.resourceById.get(booking.resourceId);
      if (!resource) return;

      if (resourceType === 'equipment' && booking.isOverbooked) {
        warningsList.push({
          resourceId: booking.resourceId,
          resourceName: resource.name,
          date: booking.date,
          type: 'overbooked',
          severity: booking.totalUsed > (resource.stock * 1.5) ? 'high' : 'medium',
          details: {
            stock: resource.stock,
            used: booking.totalUsed,
            overbooked: booking.totalUsed - resource.stock,
            events: booking.bookings
          }
        });
      }
      
      if (resourceType === 'crew' && booking.isOverbooked) {
        warningsList.push({
          resourceId: booking.resourceId,
          resourceName: resource.name,
          date: booking.date,
          type: 'conflict',
          severity: booking.totalAssignments > 2 ? 'high' : 'medium',
          details: {
            assignments: booking.assignments
          }
        });
      }
    });

    return warningsList;
  }, [bookingsData, resourceData, resourceType]);

  // SUBRENTAL SUGGESTIONS (Equipment only) - Must be before GROUPED RESOURCES
  const {
    subrentalSuggestions,
    suggestionsByDate,
    shouldShowSubrentalSection
  } = useSubrentalSuggestions({
    warnings,
    resourceType,
    visibleTimelineStart,
    visibleTimelineEnd
  });

  // ENSURE SUBRENTAL IS ALWAYS EXPANDED
  useEffect(() => {
    if (shouldShowSubrentalSection && !expandedGroups.has('Subrental')) {
      setExpandedGroups(prev => new Set([...prev, 'Subrental']));
    }
  }, [shouldShowSubrentalSection, expandedGroups, setExpandedGroups]);

  // GROUPED RESOURCES
  const resourceGroups = useMemo(() => {
    if (!resourceData?.resources) return [];

    const groupsMap = new Map();
    
    // Add Subrental section if we have suggestions (Equipment only)
    if (resourceType === 'equipment' && shouldShowSubrentalSection) {
      groupsMap.set('Subrental', {
        mainFolder: 'Subrental',
        equipment: [], // Will be populated with suggestion placeholders
        subFolders: [],
        isExpanded: true, // Always expanded to show suggestions
        isSubrentalSection: true // Special flag for identification
      });
    }
    
    resourceData.resources.forEach(resource => {
      const { mainFolder, subFolder } = resource;
      
      if (!groupsMap.has(mainFolder)) {
        groupsMap.set(mainFolder, {
          mainFolder,
          equipment: [], // Keep name for compatibility
          subFolders: [],
          isExpanded: expandedGroups.has(mainFolder)
        });
      }
      
      const group = groupsMap.get(mainFolder);
      
      if (subFolder) {
        let subFolderObj = group.subFolders.find(sf => sf.name === subFolder);
        if (!subFolderObj) {
          subFolderObj = {
            name: subFolder,
            mainFolder,
            equipment: [],
            isExpanded: expandedGroups.has(`${mainFolder}/${subFolder}`)
          };
          group.subFolders.push(subFolderObj);
        }
        subFolderObj.equipment.push(resource);
      } else {
        group.equipment.push(resource);
      }
    });

    // Populate Subrental section with suggestion placeholders
    if (resourceType === 'equipment' && shouldShowSubrentalSection) {
      const subrentalGroup = groupsMap.get('Subrental');
      if (subrentalGroup) {
        // Create unique placeholder items for each unique equipment suggestion
        const uniqueEquipment = new Map();
        subrentalSuggestions.forEach(suggestion => {
          if (!uniqueEquipment.has(suggestion.equipmentId)) {
            uniqueEquipment.set(suggestion.equipmentId, {
              id: `subrental-${suggestion.equipmentId}`,
              name: suggestion.equipmentName,
              stock: 0, // Placeholder, not actual stock
              folderPath: 'Subrental',
              mainFolder: 'Subrental',
              subFolder: undefined,
              level: 1,
              isSubrentalPlaceholder: true,
              originalEquipmentId: suggestion.equipmentId
            });
          }
        });
        subrentalGroup.equipment = Array.from(uniqueEquipment.values());
      }
    }

    let groups = Array.from(groupsMap.values());
    
    // Sort subfolders within each group according to SUBFOLDER_ORDER
    groups.forEach(group => {
      if (group.subFolders.length > 0) {
        const orderArray = SUBFOLDER_ORDER[group.mainFolder as any] || [];
        group.subFolders.sort((a, b) => {
          const indexA = orderArray.indexOf(a.name);
          const indexB = orderArray.indexOf(b.name);
          
          if (indexA === -1 && indexB === -1) return a.name.localeCompare(b.name);
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          
          return indexA - indexB;
        });
      }
    });
    
    // Debug: Log all derived main folder names before sorting
    // Sort equipment folders according to FOLDER_ORDER (logging removed)
    
    // Sort by resource type
    if (resourceType === 'equipment') {
      return groups.sort((a, b) => {
        const indexA = FOLDER_ORDER.indexOf(a.mainFolder as any);
        const indexB = FOLDER_ORDER.indexOf(b.mainFolder as any);
        
        // Debug logging to identify folder name mismatches
        if (process.env.NODE_ENV === 'development') {
          // Handle unknown folders (logging removed for performance)
        }
        
        // Handle folders not in the predefined order
        if (indexA === -1 && indexB === -1) return a.mainFolder.localeCompare(b.mainFolder);
        if (indexA === -1) return 1; // Put unknown folders at the end
        if (indexB === -1) return -1; // Keep known folders at the beginning
        
        return indexA - indexB;
      });
    } else {
      // Crew sorting with Sonic City → Associates → Freelancers priority
      const CREW_FOLDER_ORDER = ["Sonic City", "Associates", "Freelancers"];
      return groups.sort((a, b) => {
        const indexA = CREW_FOLDER_ORDER.indexOf(a.mainFolder);
        const indexB = CREW_FOLDER_ORDER.indexOf(b.mainFolder);
        
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        
        return a.mainFolder.localeCompare(b.mainFolder);
      });
    }
  }, [resourceData?.resources, expandedGroups, resourceType, shouldShowSubrentalSection, subrentalSuggestions]);

  // SIMPLIFIED PROJECT USAGE - No complex filtering
  const projectUsage = useMemo(() => {
    if (!bookingsData) return new Map();

    const usage = new Map();
    
    // Process all bookings - simpler and more reliable
    Array.from(bookingsData.values()).forEach(booking => {
      const resourceId = booking.resourceId;
      
      if (!usage.has(resourceId)) {
        usage.set(resourceId, {
          resourceId,
          projectNames: [],
          projectQuantities: new Map()
        });
      }
      
      const resourceUsage = usage.get(resourceId);
      
      booking.bookings?.forEach(b => {
        if (!resourceUsage.projectNames.includes(b.projectName)) {
          resourceUsage.projectNames.push(b.projectName);
        }
        
        if (!resourceUsage.projectQuantities.has(b.projectName)) {
          resourceUsage.projectQuantities.set(b.projectName, new Map());
        }
        
        const projectQuantities = resourceUsage.projectQuantities.get(b.projectName);
        const existing = projectQuantities.get(booking.date);
        
        if (existing) {
          existing.quantity += (resourceType === 'equipment' ? b.quantity : 1);
        } else {
          projectQuantities.set(booking.date, {
            date: booking.date,
            quantity: resourceType === 'equipment' ? b.quantity : 1,
            eventName: b.eventName,
            projectName: b.projectName,
            role: resourceType === 'crew' ? b.role : undefined
          });
        }
      });
    });

    return usage;
  }, [bookingsData, resourceType]);

  // FUNCTIONS
  const getBookingForEquipment = useCallback((resourceId: string, dateStr: string) => {
    if (!resourceData?.resourceById || !bookingsData) return undefined;
    
    const resource = resourceData.resourceById.get(resourceId);
    if (!resource) return undefined;
    
    const booking = bookingsData.get(`${resourceId}-${dateStr}`);
    
    if (resourceType === 'equipment') {
      return booking || {
        equipmentId: resourceId,
        equipmentName: resource.name,
        date: dateStr,
        stock: resource.stock,
        bookings: [],
        totalUsed: 0,
        isOverbooked: false,
        folderPath: resource.folderPath
      };
    } else {
      return booking ? {
        crewMemberId: resourceId,
        crewMemberName: resource.name,
        date: dateStr,
        department: resource.department,
        role: resource.role,
        bookings: booking.assignments || [], // UI expects 'bookings' not 'assignments'
        assignments: booking.assignments || [], // Keep for compatibility
        totalAssignments: booking.totalAssignments || 0,
        isOverbooked: booking.isOverbooked || false,
        availability: booking.assignments?.length > 0 ? 'busy' : 'available'
      } : undefined;
    }
  }, [resourceData, bookingsData, resourceType]);

  const getProjectQuantityForDate = useCallback((projectName: string, resourceId: string, dateStr: string) => {
    const usage = projectUsage.get(resourceId);
    if (!usage) return undefined;

    const projectQuantities = usage.projectQuantities.get(projectName);
    return projectQuantities?.get(dateStr);
  }, [projectUsage]);

  const getLowestAvailable = useCallback((resourceId: string, dateStrings?: string[]) => {
    const resource = resourceData?.resourceById.get(resourceId);
    if (!resource) return 0;

    if (resourceType === 'equipment') {
      if (!dateStrings?.length) return resource.stock;
      
      let lowest = resource.stock;
      dateStrings.forEach(dateStr => {
        const booking = bookingsData?.get(`${resourceId}-${dateStr}`);
        const available = resource.stock - (booking?.totalUsed || 0);
        if (available < lowest) lowest = available;
      });
      return lowest;
    } else {
      // Crew: 1 = available, 0 = busy
      if (!dateStrings?.length) return 1;
      
      const hasAssignments = dateStrings.some(dateStr => {
        const booking = bookingsData?.get(`${resourceId}-${dateStr}`);
        return booking && booking.assignments?.length > 0;
      });
      
      return hasAssignments ? 0 : 1;
    }
  }, [resourceData, bookingsData, resourceType]);

  // EXPANSION HANDLERS
  const toggleGroup = useCallback((groupKey: string, expandAllSubfolders?: boolean) => {
    if (expandAllSubfolders) {
      const group = resourceGroups.find(g => g.mainFolder === groupKey);
      const subFolderKeys = group?.subFolders?.map(sf => `${groupKey}/${sf.name}`) || [];
      toggleGroupPersistent(groupKey, expandAllSubfolders, subFolderKeys);
    } else {
      toggleGroupPersistent(groupKey, false);
    }
  }, [resourceGroups, toggleGroupPersistent]);

  const toggleEquipmentExpansion = useCallback((resourceId: string) => {
    setExpandedResources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(resourceId)) {
        newSet.delete(resourceId);
      } else {
        newSet.add(resourceId);
      }
      return newSet;
    });
  }, []);

  // Initialize default expansion
  useEffect(() => {
    if (resourceGroups.length > 0) {
      const mainFolders = resourceGroups.map(g => g.mainFolder);
      initializeDefaultExpansion(mainFolders);
    }
  }, [resourceGroups, initializeDefaultExpansion]);

  // Loading state with flash prevention
  const hasStableData = useRef(false);
  const isLoading = isLoadingResources || isLoadingBookings;
  const isReady = !!resourceData && !!bookingsData;
  
  if (isReady && !isLoading) {
    hasStableData.current = true;
  }
  
  const shouldShowLoading = !hasStableData.current && isLoading;

  // RETURN UNIFIED API (compatible with both equipment and crew interfaces)
  return {
    // Data
    equipmentGroups: resourceGroups, // Named for compatibility
    equipmentById: resourceData?.resourceById || new Map(),
    bookingsData: bookingsData || new Map(),
    expandedGroups,
    expandedEquipment: expandedResources,
    equipmentProjectUsage: projectUsage,
    
    // Subrental data
    subrentalSuggestions,
    suggestionsByDate,
    shouldShowSubrentalSection,
    
    // State
    isLoading: shouldShowLoading,
    isEquipmentReady: !!resourceData,
    isBookingsReady: !!bookingsData,
    
    // Functions
    getBookingForEquipment,
    getProjectQuantityForDate,
    getLowestAvailable,
    toggleGroup,
    toggleEquipmentExpansion,
    setExpandedGroups, // ADDED: For efficient batch expansion state updates
    
    // Crew-specific (when resourceType === 'crew')
    getCrewRoleForDate: getProjectQuantityForDate, // Alias for compatibility
    
    // Enhanced features
    warnings,
    conflicts: warnings.filter(w => w.type === 'overbooked' || w.type === 'conflict'),
    resolutionInProgress: false,
    
    // Placeholder functions for compatibility
    updateBookingState: () => {},
    getBookingState: () => ({}),
    batchUpdateBookings: () => {},
    clearStaleStates: () => {},
    resolveConflict: () => {}
  };
}