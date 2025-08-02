import { useEffect, useCallback, useMemo, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';
import { supabase } from '../../../integrations/supabase/client';
import { 
  FlattenedEquipment, 
  EquipmentBookingFlat, 
  EquipmentGroup, 
  EquipmentSubFolder,
  EquipmentPlannerData,
  getBookingKey,
  sortEquipmentGroups,
  sortEquipmentInGroup,
  ProjectQuantityCell,
  EquipmentProjectUsage
} from '../types';
import { FOLDER_ORDER, SUBFOLDER_ORDER } from '@/utils/folderSort';
import { usePersistentExpandedGroups } from '@/hooks/usePersistentExpandedGroups';

interface UseOptimizedEquipmentDataProps {
  periodStart: Date;
  periodEnd: Date;
  selectedOwner?: string;
}

export function useOptimizedEquipmentData({ 
  periodStart, 
  periodEnd, 
  selectedOwner 
}: UseOptimizedEquipmentDataProps) {
  // Persistent expansion state management
  const { 
    expandedGroups, 
    toggleGroup: toggleGroupPersistent, 
    initializeDefaultExpansion 
  } = usePersistentExpandedGroups();

  // Equipment-level expansion state management
  const [expandedEquipment, setExpandedEquipment] = useState<Set<string>>(new Set());
  
  // Toggle individual equipment expansion
  const toggleEquipmentExpansion = useCallback((equipmentId: string) => {
    setExpandedEquipment(prev => {
      const newSet = new Set(prev);
      if (newSet.has(equipmentId)) {
        newSet.delete(equipmentId);
      } else {
        newSet.add(equipmentId);
      }
      return newSet;
    });
  }, []);

  // SLIDING WINDOW: Limit data fetching to reasonable range even with infinite scroll
  const stableDataRange = useMemo(() => {
    // Calculate the actual visible range (assuming ~50px per day, ~1000px visible)
    const visibleDays = 20; // About 20 days visible at once
    const bufferDays = 14;  // 2 weeks buffer on each side
    const maxFetchDays = visibleDays + (bufferDays * 2); // Total: ~48 days max
    
    // Find the center point of the current period
    const periodLength = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    
    if (periodLength <= maxFetchDays) {
      // Period is small enough, use it directly
      return {
        start: addDays(periodStart, -3),
        end: addDays(periodEnd, 3)
      };
    }
    
    // Period is too large - use sliding window around today or selected date
    const today = new Date();
    const referenceDate = today; // Use today as reference point
    
    const windowStart = addDays(referenceDate, -bufferDays);
    const windowEnd = addDays(referenceDate, bufferDays + visibleDays);
    
    return {
      start: windowStart,
      end: windowEnd
    };
  }, [
    format(periodStart, 'yyyy-MM-dd'),
    format(periodEnd, 'yyyy-MM-dd'),
    Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) // Track period length
  ]); // Track actual date changes and period size

  // Fetch equipment structure with immediate loading and caching
  const { data: equipmentData, isLoading: isLoadingEquipment } = useQuery({
    queryKey: ['optimized-equipment-structure', selectedOwner],
    queryFn: async (): Promise<{ 
      flattenedEquipment: FlattenedEquipment[];
      equipmentById: Map<string, FlattenedEquipment>;
    }> => {
      // Try to get from localStorage first for instant loading
      const cacheKey = `equipment-structure-${selectedOwner || 'all'}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        try {
          const { data: cachedData, timestamp } = JSON.parse(cached);
          // Use cache if less than 5 minutes old
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            const equipmentById = new Map(cachedData.equipmentById);
            // Return cached data immediately, fetch will happen in background
            setTimeout(() => {
              // Background fetch after returning cached data
              fetchFreshEquipmentData(cacheKey);
            }, 0);
            return {
              flattenedEquipment: cachedData.flattenedEquipment,
              equipmentById
            };
          }
        } catch (e) {
          console.warn('Failed to parse cached equipment data');
        }
      }
      
      return await fetchFreshEquipmentData(cacheKey);
    },
    staleTime: 30 * 1000, // 30 seconds - aggressive refresh for cache updates
    gcTime: 10 * 60 * 1000, // Keep in memory for 10 minutes
  });

  // Separate function for fresh data fetching
  const fetchFreshEquipmentData = async (cacheKey: string) => {
    const [equipmentResult, foldersResult] = await Promise.all([
      supabase
        .from('equipment')
        .select('id, name, stock, folder_id'),
      supabase
        .from('equipment_folders')
        .select('*')
    ]);

    const { data: equipment, error: equipmentError } = equipmentResult;
    const { data: folders, error: foldersError } = foldersResult;

    if (equipmentError) throw equipmentError;
    if (foldersError) throw foldersError;

    // Create folder lookup map
    const folderMap = new Map(folders?.map(f => [f.id, f]) || []);
    
    // Transform to flattened structure
    const flattenedEquipment: FlattenedEquipment[] = [];
    const equipmentById = new Map<string, FlattenedEquipment>();

    equipment?.forEach(eq => {
      const folder = folderMap.get(eq.folder_id);
      const parentFolder = folder?.parent_id ? folderMap.get(folder.parent_id) : null;
      
      const mainFolder = parentFolder?.name || folder?.name || 'Uncategorized';
      const subFolder = folder?.parent_id ? folder.name : undefined;
      const folderPath = subFolder ? `${mainFolder}/${subFolder}` : mainFolder;

      const flatEquipment: FlattenedEquipment = {
        id: eq.id,
        name: eq.name,
        stock: eq.stock || 0,
        folderPath,
        mainFolder,
        subFolder,
        level: subFolder ? 2 : 1
      };

      flattenedEquipment.push(flatEquipment);
      equipmentById.set(eq.id, flatEquipment);
    });

    const result = { flattenedEquipment, equipmentById };
    
    // Cache the result
    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        data: {
          flattenedEquipment: result.flattenedEquipment,
          equipmentById: Array.from(result.equipmentById.entries())
        },
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('Failed to cache equipment data');
    }

    return result;
  };

  // Fetch booking data with keepPreviousData to prevent loading states during expansion
  const { data: bookingsData, isLoading: isLoadingBookings } = useQuery({
    queryKey: [
      'optimized-equipment-bookings', 
      format(stableDataRange.start, 'yyyy-MM-dd'), // Sliding window start
      format(stableDataRange.end, 'yyyy-MM-dd'),   // Sliding window end  
      selectedOwner,
      'v5-sliding-window' // Version key for sliding window approach
    ],
    queryFn: async (): Promise<Map<string, EquipmentBookingFlat>> => {
      // Optimized query strategy: Use simpler joins and fetch only what we need
      const dateRangeStart = format(stableDataRange.start, 'yyyy-MM-dd');
      const dateRangeEnd = format(stableDataRange.end, 'yyyy-MM-dd');
      
      // Debug logging to track query performance
      const dayRange = Math.ceil((stableDataRange.end.getTime() - stableDataRange.start.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`📊 Booking query: ${dateRangeStart} to ${dateRangeEnd} (${dayRange} days)`);
      const queryStart = Date.now();
      
      // Query 1: Get events in date range with project info
      let eventsQuery = supabase
        .from('project_events')
        .select(`
          id,
          date,
          name,
          project_id,
          project:projects!inner (
            name,
            owner_id
          )
        `)
        .gte('date', dateRangeStart)
        .lte('date', dateRangeEnd);

      if (selectedOwner) {
        eventsQuery = eventsQuery.eq('project.owner_id', selectedOwner);
      }

      const { data: events, error: eventsError } = await eventsQuery;
      if (eventsError) throw eventsError;

      if (!events || events.length === 0) {
        return new Map(); // No events in range
      }

      // Query 2: Get equipment bookings for these specific events (much faster)
      const eventIds = events.map(e => e.id);
      const { data: equipmentBookings, error: equipmentError } = await supabase
        .from('project_event_equipment')
        .select('event_id, equipment_id, quantity')
        .in('event_id', eventIds);

      if (equipmentError) throw equipmentError;

      // Create event lookup map for faster processing
      const eventMap = new Map(events.map(e => [e.id, e]));
      
      // Transform to optimized booking structure
      const bookingsByKey = new Map<string, EquipmentBookingFlat>();
      
      equipmentBookings?.forEach(equipmentBooking => {
        const event = eventMap.get(equipmentBooking.event_id);
        if (!event) return; // Skip if event not found
        
        const equipmentId = equipmentBooking.equipment_id;
        const date = event.date;
        const key = getBookingKey(equipmentId, date);
        
        if (!bookingsByKey.has(key)) {
          const equipment = equipmentData?.equipmentById.get(equipmentId);
          bookingsByKey.set(key, {
            equipmentId,
            equipmentName: equipment?.name || 'Unknown',
            date,
            stock: equipment?.stock || 0,
            bookings: [],
            totalUsed: 0,
            isOverbooked: false,
            folderPath: equipment?.folderPath || 'Uncategorized'
          });
        }
        
        const booking = bookingsByKey.get(key)!;
        booking.bookings.push({
          quantity: equipmentBooking.quantity || 0,
          projectName: event.project.name,
          eventName: event.name
        });
        booking.totalUsed += equipmentBooking.quantity || 0;
        booking.isOverbooked = booking.totalUsed > booking.stock;
      });

      // Debug logging for performance tracking
      const queryTime = Date.now() - queryStart;
      console.log(`⚡ Booking query completed in ${queryTime}ms for ${dayRange} days (${bookingsByKey.size} bookings)`);

      return bookingsByKey;
    },
    enabled: !!equipmentData,
    staleTime: 15 * 1000, // 15 seconds - very responsive for smaller data ranges
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes  
    keepPreviousData: true, // Prevent loading states during timeline expansion
    refetchOnWindowFocus: true, // Refetch when user comes back to window
    refetchInterval: 30 * 1000, // Background refetch every 30 seconds for live data
    retry: 3, // Quick retry for failed requests
  });

  // Transform flattened equipment into grouped structure
  const equipmentGroups: EquipmentGroup[] = useMemo(() => {
    if (!equipmentData?.flattenedEquipment) return [];

    const groupsMap = new Map<string, EquipmentGroup>();
    
    equipmentData.flattenedEquipment.forEach(equipment => {
      const { mainFolder, subFolder } = equipment;
      
      if (!groupsMap.has(mainFolder)) {
        groupsMap.set(mainFolder, {
          mainFolder,
          equipment: [],
          subFolders: [],
          isExpanded: expandedGroups.has(mainFolder)
        });
      }
      
      const group = groupsMap.get(mainFolder)!;
      
      if (subFolder) {
        // Equipment belongs to a subfolder
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
        subFolderObj.equipment.push(equipment);
      } else {
        // Equipment belongs directly to main folder
        group.equipment.push(equipment);
      }
    });

    // Sort groups and equipment
    const groups = Array.from(groupsMap.values());
    const sortedGroups = sortEquipmentGroups(groups, FOLDER_ORDER);
    
    sortedGroups.forEach(group => {
      group.equipment = sortEquipmentInGroup(group.equipment);
      group.subFolders.forEach(subFolder => {
        subFolder.equipment = sortEquipmentInGroup(subFolder.equipment);
      });
      
      // Sort subfolders according to predefined order
      const subfolderOrder = SUBFOLDER_ORDER[group.mainFolder] || [];
      group.subFolders.sort((a, b) => {
        const indexA = subfolderOrder.indexOf(a.name);
        const indexB = subfolderOrder.indexOf(b.name);
        
        if (indexA === -1 && indexB === -1) return a.name.localeCompare(b.name);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        
        return indexA - indexB;
      });
    });

    return sortedGroups;
  }, [equipmentData?.flattenedEquipment, expandedGroups]);

  // Stabilize booking lookup function to prevent cascade re-renders
  const bookingsDataRef = useRef(bookingsData);
  bookingsDataRef.current = bookingsData;
  
  const equipmentDataRef = useRef(equipmentData);
  equipmentDataRef.current = equipmentData;
  
  const periodStartRef = useRef(periodStart);
  periodStartRef.current = periodStart;
  
  const periodEndRef = useRef(periodEnd);
  periodEndRef.current = periodEnd;
  
  // Debug: Track when function gets recreated
  const functionCreationTime = useRef(Date.now());
  
  const getBookingForEquipment = useCallback((equipmentId: string, dateStr: string): EquipmentBookingFlat | undefined => {
    // Always return equipment info immediately
    const equipment = equipmentDataRef.current?.equipmentById.get(equipmentId);
    if (!equipment) return undefined;
    
    // Try to get actual booking data if available
    const booking = bookingsDataRef.current?.get(getBookingKey(equipmentId, dateStr));
    
    if (booking) {
      return booking; // Return actual booking data
    }
    
    // No booking - return equipment with zero usage
    return {
      equipmentId,
      equipmentName: equipment.name,
      date: dateStr,
      stock: equipment.stock,
      bookings: [],
      totalUsed: 0,
      isOverbooked: false,
      folderPath: equipment.folderPath
    };
  }, [bookingsData]); // Re-create when bookings change -> triggers re-renders
  
  // Debug: Log when function reference changes
  useEffect(() => {
    const now = Date.now();
    const timeSinceCreation = now - functionCreationTime.current;
    console.log(`🔄 getBookingForEquipment recreated! Time since last: ${timeSinceCreation}ms, hasBookings: ${!!bookingsData}`);
    functionCreationTime.current = now;
  }, [getBookingForEquipment]);

  // Equipment data ref already defined above - removed duplicate
  
  const getLowestAvailable = useCallback((equipmentId: string, dates: string[]): number => {
    if (!equipmentDataRef.current?.equipmentById || !bookingsDataRef.current) {
      return equipmentDataRef.current?.equipmentById.get(equipmentId)?.stock || 0;
    }
    
    const equipment = equipmentDataRef.current.equipmentById.get(equipmentId);
    if (!equipment) return 0;
    
    let lowest = equipment.stock;
    
    // Filter dates to only those within the actual period range
    const filteredDates = dates.filter(dateStr => {
      const requestDate = new Date(dateStr);
      return requestDate >= periodStartRef.current && requestDate <= periodEndRef.current;
    });
    
    filteredDates.forEach(dateStr => {
      const booking = bookingsDataRef.current!.get(getBookingKey(equipmentId, dateStr));
      if (booking) {
        const available = equipment.stock - booking.totalUsed;
        lowest = Math.min(lowest, available);
      }
    });
    
    return Math.max(0, lowest);
  }, []); // No dependencies - function never changes reference

  // Generate project usage data for expanded equipment view
  const equipmentProjectUsage = useMemo(() => {
    if (!bookingsData) return new Map<string, EquipmentProjectUsage>();
    
    const usage = new Map<string, EquipmentProjectUsage>();
    
    // Aggregate project usage per equipment
    bookingsData.forEach((booking) => {
      const { equipmentId } = booking;
      
      if (!usage.has(equipmentId)) {
        usage.set(equipmentId, {
          equipmentId,
          projectNames: [],
          projectQuantities: new Map()
        });
      }
      
      const equipmentUsage = usage.get(equipmentId)!;
      
      // Process each booking for this equipment/date
      booking.bookings.forEach((projectBooking) => {
        const { projectName, eventName, quantity } = projectBooking;
        
        // Add project to list if not already there
        if (!equipmentUsage.projectNames.includes(projectName)) {
          equipmentUsage.projectNames.push(projectName);
        }
        
        // Initialize project quantities map if needed
        if (!equipmentUsage.projectQuantities.has(projectName)) {
          equipmentUsage.projectQuantities.set(projectName, new Map());
        }
        
        const projectQuantities = equipmentUsage.projectQuantities.get(projectName)!;
        
        // Add or accumulate quantity for this date
        const existingQuantity = projectQuantities.get(booking.date);
        if (existingQuantity) {
          existingQuantity.quantity += quantity;
        } else {
          projectQuantities.set(booking.date, {
            date: booking.date,
            quantity,
            eventName,
            projectName
          });
        }
      });
    });
    
    // Sort project names for consistent ordering
    usage.forEach((equipmentUsage) => {
      equipmentUsage.projectNames.sort();
    });
    
    return usage;
  }, [bookingsData]);

  // Helper function to get project quantity for specific equipment/project/date
  const getProjectQuantityForDate = useCallback((projectName: string, equipmentId: string, dateStr: string): ProjectQuantityCell | undefined => {
    const equipmentUsage = equipmentProjectUsage.get(equipmentId);
    if (!equipmentUsage) return undefined;
    
    const projectQuantities = equipmentUsage.projectQuantities.get(projectName);
    if (!projectQuantities) return undefined;
    
    return projectQuantities.get(dateStr);
  }, [equipmentProjectUsage]);

  // Group management functions with persistent state
  const toggleGroup = useCallback((groupKey: string, expandAllSubfolders = false) => {
    if (expandAllSubfolders && !groupKey.includes('/')) {
      // Main folder with modifier key: get all subfolder keys for this group
      const group = equipmentGroups.find(g => g.mainFolder === groupKey);
      const subFolderKeys = group?.subFolders.map(subFolder => 
        `${groupKey}/${subFolder.name}`
      ) || [];
      
      toggleGroupPersistent(groupKey, expandAllSubfolders, subFolderKeys);
    } else {
      // Normal toggle
      toggleGroupPersistent(groupKey, false);
    }
  }, [equipmentGroups, toggleGroupPersistent]);

  // Initialize default expanded state for new installations/first load
  useEffect(() => {
    if (equipmentGroups.length > 0) {
      const mainFolders = equipmentGroups.map(g => g.mainFolder);
      initializeDefaultExpansion(mainFolders);
    }
  }, [equipmentGroups, initializeDefaultExpansion]);

  const isLoading = isLoadingEquipment || isLoadingBookings;
  
  // More granular loading states for better UX
  const isEquipmentReady = !!equipmentData?.equipmentById;
  const isBookingsReady = !!bookingsData;

  return {
    equipmentGroups,
    equipmentById: equipmentData?.equipmentById || new Map(),
    bookingsData: bookingsData || new Map(),
    expandedGroups,
    expandedEquipment, // New: equipment-level expansion state
    equipmentProjectUsage, // New: project usage aggregation
    isLoading,
    isEquipmentReady,
    isBookingsReady,
    getBookingForEquipment,
    getProjectQuantityForDate, // New: get project quantity for specific date
    getLowestAvailable,
    toggleGroup,
    toggleEquipmentExpansion, // New: equipment expansion toggle function
    // Remove complex version tracking
  };
}