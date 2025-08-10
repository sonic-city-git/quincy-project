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
// ✅ NEW: Using ONE ENGINE directly via page wrapper
import { useTimelineStock } from '@/hooks/useEquipmentStockEngine';
import { useConfirmedSubrentals } from '@/hooks/equipment/useConfirmedSubrentals';

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

  // ✅ ELIMINATED: Equipment bookings now come from stock engine
  // The stock engine provides comprehensive project assignment details

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



  // ✅ USE ONE ENGINE - Define stock engine FIRST before any dependencies
  const timelineStock = resourceType === 'equipment' && visibleTimelineStart && visibleTimelineEnd 
    ? useTimelineStock({
        start: visibleTimelineStart,
        end: visibleTimelineEnd
        // ✅ NO OWNER FILTER: Timeline shows ALL equipment across all owners
      })
    : { 
        conflicts: [], 
        isLoading: false, 
        getEquipmentStock: () => null,
        equipment: new Map(),
        virtualStock: new Map(),
        suggestions: [],
        // ✅ ADDED: Timeline data
        bookings: new Map(),
        projectUsage: new Map(),
        // ✅ ADDED: Date range
        startDate: '',
        endDate: '',
        totalConflicts: 0,
        totalDeficit: 0,
        affectedEquipmentCount: 0,
        getConflicts: () => [],
        getSuggestions: () => [],
        isOverbooked: () => false,
        getAvailability: () => 0,
        // ✅ ADDED: Timeline methods
        getBooking: () => null,
        getProjectUsage: () => null,
        getProjectQuantityForDate: () => null,
        error: null
      };



  // RESOURCE DATA (Equipment or Crew)
  // ✅ FOR EQUIPMENT: Use stock engine data instead of manual fetch
  // For CREW: Still use manual fetch until crew engine is implemented
  const { data: resourceData, isLoading: isLoadingResources } = useQuery({
    queryKey: [`timeline-${resourceType}`, selectedOwner],
    queryFn: resourceType === 'equipment' ? fetchEquipmentData : fetchCrewData,
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // ✅ SIMPLIFIED: Always use manual resource data for equipment listing
  // Stock engine only provides calculations, not equipment listing
  const mergedResourceData = resourceData;

  // EARLY CALCULATION: Get expanded equipment IDs before booking fetch for smart optimization
  const expandedEquipmentIds = useMemo(() => {
    if (!mergedResourceData?.resources) return [];
    
    const expandedIds: string[] = [];
    const groupsMap = new Map();
    
    // Build groups structure first
    mergedResourceData.resources.forEach(resource => {
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
  }, [mergedResourceData?.resources, expandedGroups]);

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
      ? new Map() // ✅ ELIMINATED: Equipment bookings now come from stock engine
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
    if (!rawBookingsData || !mergedResourceData?.resourceById) return rawBookingsData;
    
    // Add stock info from resource data
    const processedBookings = new Map();
    
    rawBookingsData.forEach((booking, key) => {
      const resource = mergedResourceData.resourceById.get(booking.resourceId);
      const processedBooking = { ...booking };
      
      if (resourceType === 'equipment' && resource) {
        // ✅ NO MANUAL CALCULATIONS - data comes from stock engine
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
  }, [rawBookingsData, mergedResourceData?.resourceById, resourceType]);

  // ✅ EQUIPMENT ENGINE INTEGRATION - replaces ALL manual conflict/warning logic
  const equipmentIds = useMemo(() => 
    mergedResourceData?.resources?.map(r => r.id) || [], 
    [mergedResourceData]
  );
  
  const visibleDates = useMemo(() => {
    if (!visibleTimelineStart || !visibleTimelineEnd) return [];
    
    const dates = [];
    let currentDate = new Date(visibleTimelineStart);
    const endDate = new Date(visibleTimelineEnd);
    
    while (currentDate <= endDate) {
      dates.push(format(currentDate, 'yyyy-MM-dd'));
      currentDate = addDays(currentDate, 1);
    }
    
    return dates;
  }, [visibleTimelineStart, visibleTimelineEnd]);

  // ✅ timelineStock already defined above - no duplicate needed
  
  // Transform conflicts to warning format for backward compatibility
  const warnings = useMemo(() => {
    if (resourceType === 'equipment') {
      return timelineStock.conflicts.map(conflict => ({
        resourceId: conflict.equipmentId,
        resourceName: conflict.equipmentName,
        date: conflict.date,
        type: conflict.conflict.deficit > 0 ? 'overbooked' : 'resolved',
        severity: conflict.conflict.deficit > 5 ? 'high' : 'medium',
        details: {
          stock: conflict.stockBreakdown.effectiveStock,
          used: conflict.stockBreakdown.totalUsed,
          overbooked: conflict.conflict.deficit,
          virtualAdditions: conflict.stockBreakdown.virtualAdditions,
          events: conflict.conflict.affectedEvents || []
        }
      }));
    } else {
      // Crew logic remains separate (for now)
      return [];
    }
  }, [resourceType, timelineStock.conflicts]);

  // ✅ ELIMINATED: Manual equipment bookings calculation - using ONE ENGINE now

  // ✅ GLOBAL WARNINGS - Using engine conflicts (for subrental analysis)
  const globalWarnings = useMemo(() => {
    if (resourceType !== 'equipment') return [];
    
    // Use timelineStock conflicts as global warnings
    return timelineStock.conflicts.map(conflict => ({
      resourceId: conflict.equipmentId,
      resourceName: conflict.equipmentName,
      date: conflict.date,
      type: 'overbooked',
      severity: conflict.conflict.deficit > 5 ? 'high' : 'medium',
      details: {
        stock: conflict.stockBreakdown.effectiveStock,
        used: conflict.stockBreakdown.totalUsed,
        overbooked: conflict.conflict.deficit,
        events: conflict.conflict.affectedEvents || []
      }
    }));
  }, [resourceType, timelineStock.conflicts]);

  // SUBRENTAL SUGGESTIONS - TODO: Integrate with ONE ENGINE later
  // For now, return empty data to prevent timeline errors
  const subrentalSuggestions = [];
  const suggestionsByDate = new Map();
  const shouldShowSubrentalSection = false;
  const suggestionsLoading = false;
  const suggestionsError = null;

  // CONFIRMED SUBRENTALS (Equipment only)
  const {
    confirmedSubrentals,
    confirmedPeriods,
    periodsByDate: confirmedPeriodsByDate,
    shouldShowConfirmedSection
  } = useConfirmedSubrentals({
    visibleTimelineStart,
    visibleTimelineEnd,
    enabled: resourceType === 'equipment'
  });

  // ENSURE SUBRENTAL SECTIONS ARE ALWAYS EXPANDED
  useEffect(() => {
    const sectionsToExpand = [];
    if (shouldShowSubrentalSection && !expandedGroups.has('Needed Subrental')) {
      sectionsToExpand.push('Needed Subrental');
    }
    if (shouldShowConfirmedSection && !expandedGroups.has('Confirmed Subrental')) {
      sectionsToExpand.push('Confirmed Subrental');
    }
    
    if (sectionsToExpand.length > 0) {
      setExpandedGroups(prev => new Set([...prev, ...sectionsToExpand]));
    }
  }, [shouldShowSubrentalSection, shouldShowConfirmedSection, expandedGroups, setExpandedGroups]);

  // GROUPED RESOURCES
  const resourceGroups = useMemo(() => {
    if (!mergedResourceData?.resources) return [];

    const groupsMap = new Map();
    
    // Add Needed Subrental section if we have suggestions (Equipment only)
    if (resourceType === 'equipment' && shouldShowSubrentalSection) {
      groupsMap.set('Needed Subrental', {
        mainFolder: 'Needed Subrental',
        equipment: [], // Will be populated with suggestion placeholders
        subFolders: [],
        isExpanded: true, // Always expanded to show suggestions
        isSubrentalSection: true, // Special flag for identification
        isNeededSubrental: true
      });
    }

    // Add Confirmed Subrental section if we have confirmed subrentals (Equipment only)
    if (resourceType === 'equipment' && shouldShowConfirmedSection) {
      groupsMap.set('Confirmed Subrental', {
        mainFolder: 'Confirmed Subrental',
        equipment: [], // Will be populated with confirmed subrental placeholders
        subFolders: [],
        isExpanded: true, // Always expanded to show confirmed subrentals
        isSubrentalSection: true, // Special flag for identification
        isConfirmedSubrental: true
      });
    }
    
    mergedResourceData.resources.forEach(resource => {
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

    // Populate Needed Subrental section with suggestion placeholders
    if (resourceType === 'equipment' && shouldShowSubrentalSection) {
      const neededSubrentalGroup = groupsMap.get('Needed Subrental');
      if (neededSubrentalGroup) {
        // Create unique placeholder items for each unique equipment suggestion
        const uniqueEquipment = new Map();
        subrentalSuggestions.forEach(suggestion => {
          if (!uniqueEquipment.has(suggestion.equipmentId)) {
            uniqueEquipment.set(suggestion.equipmentId, {
              id: `needed-subrental-${suggestion.equipmentId}`,
              name: suggestion.equipmentName,
              stock: 0, // Placeholder, not actual stock
              folderPath: 'Needed Subrental',
              mainFolder: 'Needed Subrental',
              subFolder: undefined,
              level: 1,
              isSubrentalPlaceholder: true,
              isNeededSubrental: true,
              originalEquipmentId: suggestion.equipmentId
            });
          }
        });
        neededSubrentalGroup.equipment = Array.from(uniqueEquipment.values());
      }
    }

    // Populate Confirmed Subrental section with confirmed subrental placeholders
    if (resourceType === 'equipment' && shouldShowConfirmedSection) {
      const confirmedSubrentalGroup = groupsMap.get('Confirmed Subrental');
      if (confirmedSubrentalGroup) {
        // Create placeholder items for each unique confirmed subrental
        const uniqueEquipment = new Map();
        confirmedPeriods.forEach(period => {
          const key = `${period.equipment_id}-${period.id}`;
          if (!uniqueEquipment.has(key)) {
            uniqueEquipment.set(key, {
              id: `confirmed-subrental-${period.id}`,
              name: `${period.equipment_name} (${period.provider_name})`,
              stock: period.quantity,
              folderPath: 'Confirmed Subrental',
              mainFolder: 'Confirmed Subrental',
              subFolder: undefined,
              level: 1,
              isSubrentalPlaceholder: true,
              isConfirmedSubrental: true,
              originalEquipmentId: period.equipment_id,
              subrentalPeriod: period
            });
          }
        });
        confirmedSubrentalGroup.equipment = Array.from(uniqueEquipment.values());
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
  }, [mergedResourceData?.resources, expandedGroups, resourceType, shouldShowSubrentalSection, subrentalSuggestions, shouldShowConfirmedSection, confirmedPeriods]);

  // SIMPLIFIED PROJECT USAGE - No complex filtering
  // ✅ USE ONE ENGINE - Project usage data comes from stock engine for equipment
  const projectUsage = useMemo(() => {
    if (resourceType === 'equipment' && timelineStock.projectUsage) {
      return timelineStock.projectUsage;
    }
    
    // Fallback for crew: manual calculation until crew engine is implemented
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
      
      // For crew, use assignments instead of bookings
      const assignments = resourceType === 'crew' ? booking.assignments : booking.bookings;
      assignments?.forEach(b => {
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
  }, [bookingsData, resourceType, timelineStock.projectUsage]);

  // FUNCTIONS
  const getBookingForEquipment = useCallback((resourceId: string, dateStr: string) => {
    if (resourceType === 'equipment' && timelineStock.getBooking) {
      // ✅ USE ONE ENGINE - comprehensive booking data with project details
      const booking = timelineStock.getBooking(resourceId, dateStr);
      if (booking) return booking;
      

      
      // Fallback: Stock data without project details for equipment without bookings
      const stockData = timelineStock.getEquipmentStock(resourceId, dateStr);
      

      
      if (!stockData) return undefined;
      
      return {
        equipmentId: stockData.equipmentId,
        equipmentName: stockData.equipmentName,
        date: stockData.date,
        stock: stockData.effectiveStock,
        totalUsed: stockData.totalUsed,
        isOverbooked: stockData.isOverbooked,
        folderPath: mergedResourceData?.resourceById?.get(resourceId)?.folderPath || '',
        bookings: []
      };
    }
    
    // Fallback for crew (will be migrated later)
    if (!mergedResourceData?.resourceById || !bookingsData) return undefined;
    
    const resource = mergedResourceData.resourceById.get(resourceId);
    if (!resource) return undefined;
    
    const booking = bookingsData.get(`${resourceId}-${dateStr}`);
    
    if (resourceType === 'crew') {
      return booking || {
        crewMemberId: resourceId,
        crewMemberName: resource.name,
        date: dateStr,
        bookings: [],
        totalAssignments: 0,
        isOverbooked: false,
        department: resource.department
      };
    }
    
    return booking;
  }, [mergedResourceData?.resourceById, bookingsData, resourceType, timelineStock.getEquipmentStock]);

  const getProjectQuantityForDate = useCallback((projectName: string, resourceId: string, dateStr: string) => {
    if (resourceType === 'equipment' && timelineStock.getProjectQuantityForDate) {
      // ✅ USE ONE ENGINE - project quantity data from stock engine
      return timelineStock.getProjectQuantityForDate(projectName, resourceId, dateStr);
    }
    
    // Fallback for crew: manual calculation
    const usage = projectUsage.get(resourceId);
    if (!usage) return undefined;

    const projectQuantities = usage.projectQuantities.get(projectName);
    return projectQuantities?.get(dateStr);
  }, [projectUsage, resourceType, timelineStock.getProjectQuantityForDate]);

  const getLowestAvailable = useCallback((resourceId: string, dateStrings?: string[]) => {
    const resource = mergedResourceData?.resourceById.get(resourceId);
    if (!resource) return 0;

    if (resourceType === 'equipment') {
      if (!dateStrings?.length) return resource.stock;
      
      // ✅ USE STOCK ENGINE for equipment availability calculation
      let lowest = resource.stock;
      dateStrings.forEach(dateStr => {
        const stockData = timelineStock.getEquipmentStock(resourceId, dateStr);
        if (stockData) {
          // ✅ USE ENGINE: Direct available property (includes virtual stock)
          if (stockData.available < lowest) lowest = stockData.available;
        }
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
  }, [mergedResourceData, bookingsData, resourceType, timelineStock.getEquipmentStock]);

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
  const isReady = !!mergedResourceData && !!bookingsData;
  
  if (isReady && !isLoading) {
    hasStableData.current = true;
  }
  
  const shouldShowLoading = !hasStableData.current && isLoading;

  // RETURN UNIFIED API (compatible with both equipment and crew interfaces)
  return {
    // Data
    equipmentGroups: resourceGroups, // Named for compatibility
    equipmentById: mergedResourceData?.resourceById || new Map(),
    bookingsData: bookingsData || new Map(),
    expandedGroups,
    expandedEquipment: expandedResources,
    equipmentProjectUsage: projectUsage,
    
    // Subrental data
    subrentalSuggestions,
    suggestionsByDate,
    shouldShowSubrentalSection,
    
    // Confirmed subrental data
    confirmedSubrentals,
    confirmedPeriods,
    confirmedPeriodsByDate,
    shouldShowConfirmedSection,
    
    // State
    isLoading: shouldShowLoading,
    isEquipmentReady: !!mergedResourceData,
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