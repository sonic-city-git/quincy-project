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
import { usePersistentExpandedGroups } from '@/hooks/usePersistentExpandedGroups';
import { FOLDER_ORDER, SUBFOLDER_ORDER } from '@/utils/folderSort';
import { PERFORMANCE } from '../constants';

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

  // SLIDING WINDOW DATA MANAGEMENT - Ultimate Performance
  const stableDataRange = useMemo(() => {
    const centerDate = new Date();
    const baseBufferDays = 40;
    const maxWindowDays = PERFORMANCE.MAX_RENDERED_DAYS; // 90 days max
    
    // Calculate the current timeline span
    const timelineSpanDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (24 * 60 * 60 * 1000));
    
    // SLIDING WINDOW: Limit total data range to prevent unlimited growth
    const effectiveBuffer = Math.min(baseBufferDays, maxWindowDays / 2);
    
    // Calculate adaptive buffer based on timeline size, but cap it
    const adaptiveBuffer = Math.min(
      Math.max(effectiveBuffer, timelineSpanDays * 0.3),
      maxWindowDays / 2
    );
    
    // Create sliding window centered on visible timeline
    const visibleCenter = new Date((periodStart.getTime() + periodEnd.getTime()) / 2);
    const windowStart = new Date(visibleCenter.getTime() - adaptiveBuffer * 24 * 60 * 60 * 1000);
    const windowEnd = new Date(visibleCenter.getTime() + adaptiveBuffer * 24 * 60 * 60 * 1000);
    
    // Always include visible timeline with small margin
    const marginDays = 14; // 2 weeks margin
    const finalStart = new Date(Math.min(
      periodStart.getTime() - marginDays * 24 * 60 * 60 * 1000,
      windowStart.getTime()
    ));
    const finalEnd = new Date(Math.max(
      periodEnd.getTime() + marginDays * 24 * 60 * 60 * 1000,
      windowEnd.getTime()
    ));
    
    // Ensure we don't exceed max window size
    const totalDays = Math.ceil((finalEnd.getTime() - finalStart.getTime()) / (24 * 60 * 60 * 1000));
    if (totalDays > maxWindowDays) {
      // Trim from the furthest edge
      const excess = totalDays - maxWindowDays;
      const trimDays = Math.ceil(excess / 2);
      
      return {
        start: new Date(finalStart.getTime() + trimDays * 24 * 60 * 60 * 1000),
        end: new Date(finalEnd.getTime() - trimDays * 24 * 60 * 60 * 1000)
      };
    }
    
    return { start: finalStart, end: finalEnd };
  }, [
    // Use 3-day buckets for responsive updates while maintaining stability
    Math.floor(periodStart.getTime() / (3 * 24 * 60 * 60 * 1000)), 
    Math.floor(periodEnd.getTime() / (3 * 24 * 60 * 60 * 1000))
  ]);

  // EXPANSION STATE
  const storageKey = resourceType === 'equipment' ? 'equipmentPlannerExpandedGroups' : 'crewPlannerExpandedGroups';
  const {
    expandedGroups,
    toggleGroup: toggleGroupPersistent,
    initializeDefaultExpansion
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

    equipmentResult.data?.forEach(eq => {
      const folder = folderMap.get(eq.folder_id);
      const parentFolder = folder?.parent_id ? folderMap.get(folder.parent_id) : null;
      
      const mainFolder = parentFolder?.name || folder?.name || 'Uncategorized';
      const subFolder = folder?.parent_id ? folder.name : undefined;
      const folderPath = subFolder ? `${mainFolder}/${subFolder}` : mainFolder;

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
    const [crewResult, memberRolesResult, crewRolesResult] = await Promise.all([
      supabase.from('crew_members').select('id, name, email, phone, folder_id, avatar_url'),
      supabase.from('crew_member_roles').select('*'),
      supabase.from('crew_roles').select('*')
    ]);

    if (crewResult.error) throw crewResult.error;
    if (memberRolesResult.error) throw memberRolesResult.error;
    if (crewRolesResult.error) throw crewRolesResult.error;

    // Role mappings
    const roleIdToName = new Map(crewRolesResult.data?.map(role => [role.id, role.name]) || []);
    const memberIdToRoles = new Map();
    
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
      const resource = {
        id: crew.id,
        name: crew.name,
        role: memberRoles[0] || 'Crew Member',
        roles: memberRoles,
        department: 'Sonic City', // Default
        level: 'mid',
        availability: 'available',
        hourlyRate: 75,
        skills: [],
        contactInfo: {
          email: crew.email,
          phone: crew.phone
        },
        avatarUrl: crew.avatar_url,
        mainFolder: 'Sonic City', // For grouping
        folderPath: 'Sonic City'
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

    // SMART FOLDER OPTIMIZATION: Only fetch bookings for expanded equipment
    if (expandedIds.length === 0) {
      // No folders expanded = no bookings to fetch
      if (process.env.NODE_ENV === 'development') {
        console.log('🎯 SMART FOLDER: No expanded folders, skipping booking fetch');
      }
      return new Map();
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

    if (process.env.NODE_ENV === 'development') {
      console.log(`🎯 SMART FOLDER: Fetched ${equipmentBookings?.length || 0} bookings for ${expandedIds.length} expanded equipment items`);
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
      assignment.assignments.push({
        id: role.id,
        role: role.crew_roles?.name || 'Unknown',
        projectName: role.project_events.projects?.name || 'Unknown',
        eventName: role.project_events.name || 'Unknown',
        dailyRate: role.daily_rate,
        eventType: role.project_events.event_types?.name || 'Unknown',
        eventTypeColor: role.project_events.event_types?.color || '#6B7280',
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
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎯 SMART FOLDER: ${expandedIds.length} equipment items in expanded folders out of ${resourceData?.resources?.length || 0} total`);
    }
    
    return expandedIds;
  }, [resourceData?.resources, expandedGroups]);

  // BOOKING/ASSIGNMENT DATA - Smart folder optimized with expanded equipment dependency
  const { data: rawBookingsData, isLoading: isLoadingBookings } = useQuery({
    queryKey: [
      `timeline-${resourceType}-bookings`,
      format(stableDataRange.start, 'yyyy-MM-dd'),
      format(stableDataRange.end, 'yyyy-MM-dd'),
      selectedOwner,
      expandedEquipmentIds.join(',') // Add expanded equipment as dependency
    ],
    queryFn: () => resourceType === 'equipment' 
      ? fetchEquipmentBookings(expandedEquipmentIds) 
      : fetchCrewAssignments(),
    enabled: enabled && expandedEquipmentIds.length > 0, // Only fetch if folders are expanded
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData, // Keep previous data while refetching
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
      }
      
      processedBookings.set(key, processedBooking);
    });
    
    return processedBookings;
  }, [rawBookingsData, resourceData?.resourceById, resourceType]);

  // GROUPED RESOURCES
  const resourceGroups = useMemo(() => {
    if (!resourceData?.resources) return [];

    const groupsMap = new Map();
    
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

    const groups = Array.from(groupsMap.values());
    
    // Sort by resource type
    if (resourceType === 'equipment') {
      return groups.sort((a, b) => {
        const indexA = FOLDER_ORDER.indexOf(a.mainFolder);
        const indexB = FOLDER_ORDER.indexOf(b.mainFolder);
        
        if (indexA === -1 && indexB === -1) return a.mainFolder.localeCompare(b.mainFolder);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        
        return indexA - indexB;
      });
    } else {
      // Crew sorting (by department)
      return groups.sort((a, b) => a.mainFolder.localeCompare(b.mainFolder));
    }
  }, [resourceData?.resources, expandedGroups, resourceType]);

  // PROJECT USAGE (scroll-aware and folder-optimized)
  const projectUsage = useMemo(() => {
    if (!bookingsData) return new Map();

    const timelineStart = visibleTimelineStart?.toISOString().split('T')[0] || stableDataRange.start.toISOString().split('T')[0];
    const timelineEnd = visibleTimelineEnd?.toISOString().split('T')[0] || stableDataRange.end.toISOString().split('T')[0];

    // OPTIMIZATION: Only process bookings for expanded equipment
    const expandedIdsSet = new Set(expandedEquipmentIds);
    const filteredBookings = Array.from(bookingsData.values()).filter(booking => 
      booking.date >= timelineStart && 
      booking.date <= timelineEnd &&
      expandedIdsSet.has(booking.resourceId) // Only expanded equipment
    );

    const usage = new Map();
    
    filteredBookings.forEach(booking => {
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
  }, [bookingsData, visibleTimelineStart, visibleTimelineEnd, stableDataRange, resourceType]);

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
        assignments: booking.assignments || [],
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