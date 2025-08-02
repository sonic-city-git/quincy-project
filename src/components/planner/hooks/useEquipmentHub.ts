import { useEffect, useCallback, useMemo, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';
import { supabase } from '../../../integrations/supabase/client';
import { 
  FlattenedEquipment, 
  EquipmentBookingFlat, 
  EquipmentGroup, 
  EquipmentSubFolder,
  EquipmentConflict,
  ConflictingProject,
  ResolutionStrategy,
  AutoResolveOption,
  getBookingKey,
  sortEquipmentGroups,
  sortEquipmentInGroup,
  ProjectQuantityCell,
  EquipmentProjectUsage
} from '../types';
import { FOLDER_ORDER, SUBFOLDER_ORDER } from '@/utils/folderSort';
import { usePersistentExpandedGroups } from '@/hooks/usePersistentExpandedGroups';

interface UseEquipmentHubProps {
  periodStart: Date;
  periodEnd: Date;
  selectedOwner?: string;
}

/**
 * Unified Equipment Data Hub
 * 
 * Consolidates all equipment-related data management:
 * - Equipment structure with caching
 * - Booking data with conflict detection
 * - Project usage aggregation
 * - Expansion state management
 * - Conflict resolution system
 * - Serial number tracking foundation
 */
export function useEquipmentHub({ 
  periodStart, 
  periodEnd, 
  selectedOwner 
}: UseEquipmentHubProps) {
  
  // Persistent expansion state management
  const {
    expandedGroups,
    toggleGroup: toggleGroupPersistent,
    initializeDefaultExpansion
  } = usePersistentExpandedGroups();

  // Equipment-level expansion state management
  const [expandedEquipment, setExpandedEquipment] = useState<Set<string>>(new Set());

  // Conflict resolution state
  const [conflicts, setConflicts] = useState<Map<string, EquipmentConflict>>(new Map());
  const [resolutionInProgress, setResolutionInProgress] = useState<Set<string>>(new Set());

  // Granular booking state for optimistic updates
  const [bookingStates, setBookingStates] = useState<Map<string, { 
    isLoading: boolean; 
    data: any; 
    lastUpdated: number;
    error?: string;
  }>>(new Map());

  // Stable data range calculation for sliding window
  const stableDataRange = useMemo(() => {
    const bufferDays = 7; // 1 week buffer for smooth scrolling
    const start = addDays(periodStart, -bufferDays);
    const end = addDays(periodEnd, bufferDays);
    
    return { start, end };
  }, [
    Math.floor(periodStart.getTime() / (1000 * 60 * 60 * 24)),
    Math.floor(periodEnd.getTime() / (1000 * 60 * 60 * 24))
  ]);

  // EQUIPMENT STRUCTURE SERVICE
  const { data: equipmentData, isLoading: isLoadingEquipment } = useQuery({
    queryKey: ['equipment-hub-structure', selectedOwner],
    queryFn: async (): Promise<{ 
      flattenedEquipment: FlattenedEquipment[];
      equipmentById: Map<string, FlattenedEquipment>;
    }> => {
      // Try cache first for instant loading
      const cacheKey = `equipment-structure-${selectedOwner || 'all'}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        try {
          const { data: cachedData, timestamp } = JSON.parse(cached);
          // Use cache if less than 5 minutes old
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            const equipmentById = new Map(cachedData.equipmentById);
            // Background fetch after returning cached data
            setTimeout(() => {
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
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Equipment data fetching function
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

  // BOOKING AGGREGATION SERVICE
  const { data: bookingsData, isLoading: isLoadingBookings } = useQuery({
    queryKey: [
      'equipment-hub-bookings',
      format(stableDataRange.start, 'yyyy-MM-dd'),
      format(stableDataRange.end, 'yyyy-MM-dd'),
      selectedOwner,
      'v6-conflict-enhanced'
    ],
    queryFn: async (): Promise<Map<string, EquipmentBookingFlat>> => {
      const dateRangeStart = format(stableDataRange.start, 'yyyy-MM-dd');
      const dateRangeEnd = format(stableDataRange.end, 'yyyy-MM-dd');
      
      const dayRange = Math.ceil((stableDataRange.end.getTime() - stableDataRange.start.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`📊 Equipment Hub booking query: ${dateRangeStart} to ${dateRangeEnd} (${dayRange} days)`);
      const queryStart = Date.now();
      
      // Query events with project info
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
        return new Map();
      }

      // Get equipment bookings for events
      const eventIds = events.map(e => e.id);
      const { data: equipmentBookings, error: equipmentError } = await supabase
        .from('project_event_equipment')
        .select('event_id, equipment_id, quantity')
        .in('event_id', eventIds);

      if (equipmentError) throw equipmentError;

      // Create event lookup map
      const eventMap = new Map(events.map(e => [e.id, e]));
      
      // Transform to optimized booking structure with conflict detection
      const bookingsByKey = new Map<string, EquipmentBookingFlat>();
      
      equipmentBookings?.forEach(equipmentBooking => {
        const event = eventMap.get(equipmentBooking.event_id);
        if (!event) return;
        
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
          eventName: event.name,
          eventId: event.id,
          projectId: event.project_id,
          priority: 'medium' // Default priority, can be enhanced later
        });
        booking.totalUsed += equipmentBooking.quantity || 0;
        booking.isOverbooked = booking.totalUsed > booking.stock;

        // Enhanced conflict detection
        if (booking.isOverbooked) {
          booking.conflict = generateConflictData(booking, equipment);
        }
      });

      const queryTime = Date.now() - queryStart;
      console.log(`⚡ Equipment Hub query completed in ${queryTime}ms (${bookingsByKey.size} bookings)`);

      return bookingsByKey;
    },
    enabled: !!equipmentData,
    staleTime: 15 * 1000,
    gcTime: 5 * 60 * 1000,
    keepPreviousData: true,
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000,
    retry: 3,
  });

  // CONFLICT RESOLUTION SERVICE
  const generateConflictData = useCallback((booking: EquipmentBookingFlat, equipment?: FlattenedEquipment): EquipmentConflict => {
    const shortage = booking.totalUsed - booking.stock;
    const conflictingProjects: ConflictingProject[] = booking.bookings.map(b => ({
      projectId: b.projectId || '',
      projectName: b.projectName,
      eventId: b.eventId || '',
      eventName: b.eventName,
      requestedQuantity: b.quantity,
      priority: b.priority || 'medium',
      canReduce: true, // Default - can be enhanced with project settings
      canReschedule: false, // Default - can be enhanced with event settings
      alternativeEquipment: [] // Can be populated with similar equipment
    }));

    const resolutionStrategies: ResolutionStrategy[] = [
      {
        id: 'reduce-quantities',
        type: 'reduce_quantities',
        title: 'Reduce Equipment Quantities',
        description: `Reduce quantities across ${conflictingProjects.length} projects to resolve ${shortage} unit shortage`,
        impact: 'moderate',
        feasibility: 'easy',
        affectedProjects: conflictingProjects.map(p => p.projectId),
        estimatedResolutionTime: 15,
        requiresApproval: true
      },
      {
        id: 'increase-stock',
        type: 'increase_stock',
        title: 'Increase Equipment Stock',
        description: `Temporarily increase stock by ${shortage} units for this date`,
        impact: 'minor',
        feasibility: 'moderate',
        affectedProjects: [],
        estimatedResolutionTime: 30,
        requiresApproval: true
      }
    ];

    const autoResolveOptions: AutoResolveOption[] = [
      {
        strategyId: 'reduce-quantities',
        canAutoResolve: false, // Requires manual review
        confidence: 70,
        reasoning: 'Can proportionally reduce quantities across projects',
        wouldRequireNotification: true
      }
    ];

    return {
      equipmentId: booking.equipmentId,
      date: booking.date,
      severity: shortage > booking.stock * 0.5 ? 'critical' : 'warning',
      totalDemand: booking.totalUsed,
      availableStock: booking.stock,
      shortage,
      conflictingProjects,
      resolutionStrategies,
      autoResolveOptions,
      createdAt: new Date()
    };
  }, []);

  // Transform equipment into grouped structure
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
        group.equipment.push(equipment);
      }
    });

    const groups = Array.from(groupsMap.values());
    const sortedGroups = sortEquipmentGroups(groups, FOLDER_ORDER);
    
    sortedGroups.forEach(group => {
      group.equipment = sortEquipmentInGroup(group.equipment);
      group.subFolders = group.subFolders.sort((a, b) => {
        const orderA = SUBFOLDER_ORDER[a.name] ?? 999;
        const orderB = SUBFOLDER_ORDER[b.name] ?? 999;
        return orderA - orderB;
      });
      group.subFolders.forEach(subFolder => {
        subFolder.equipment = sortEquipmentInGroup(subFolder.equipment);
      });
    });

    return sortedGroups;
  }, [equipmentData?.flattenedEquipment, expandedGroups]);

  // EQUIPMENT EXPANSION MANAGEMENT
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

  // PROJECT USAGE AGGREGATION
  const equipmentProjectUsage = useMemo(() => {
    if (!bookingsData) return new Map<string, EquipmentProjectUsage>();

    const usage = new Map<string, EquipmentProjectUsage>();

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

      booking.bookings.forEach((projectBooking) => {
        const { projectName, eventName, quantity } = projectBooking;

        if (!equipmentUsage.projectNames.includes(projectName)) {
          equipmentUsage.projectNames.push(projectName);
        }

        if (!equipmentUsage.projectQuantities.has(projectName)) {
          equipmentUsage.projectQuantities.set(projectName, new Map());
        }

        const projectQuantities = equipmentUsage.projectQuantities.get(projectName)!;
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

    usage.forEach((equipmentUsage) => {
      equipmentUsage.projectNames.sort();
    });

    return usage;
  }, [bookingsData]);

  // DATA ACCESS FUNCTIONS
  const equipmentDataRef = useRef(equipmentData);
  const bookingsDataRef = useRef(bookingsData);
  
  useEffect(() => {
    equipmentDataRef.current = equipmentData;
    bookingsDataRef.current = bookingsData;
  }, [equipmentData, bookingsData]);

  const getBookingForEquipment = useCallback((equipmentId: string, dateStr: string): EquipmentBookingFlat | undefined => {
    const equipment = equipmentDataRef.current?.equipmentById.get(equipmentId);
    if (!equipment) return undefined;
    
    const booking = bookingsDataRef.current?.get(getBookingKey(equipmentId, dateStr));
    
    if (booking) {
      return booking;
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
  }, [bookingsData]);

  const getProjectQuantityForDate = useCallback((projectName: string, equipmentId: string, dateStr: string): ProjectQuantityCell | undefined => {
    const equipmentUsage = equipmentProjectUsage.get(equipmentId);
    if (!equipmentUsage) return undefined;

    const projectQuantities = equipmentUsage.projectQuantities.get(projectName);
    if (!projectQuantities) return undefined;

    return projectQuantities.get(dateStr);
  }, [equipmentProjectUsage]);

  const getLowestAvailable = useCallback((equipmentId: string): number => {
    const equipment = equipmentDataRef.current?.equipmentById.get(equipmentId);
    if (!equipment) return 0;

    let lowestAvailable = equipment.stock;
    
    bookingsDataRef.current?.forEach((booking) => {
      if (booking.equipmentId === equipmentId) {
        const available = booking.stock - booking.totalUsed;
        if (available < lowestAvailable) {
          lowestAvailable = available;
        }
      }
    });

    return Math.max(0, lowestAvailable);
  }, [bookingsData]);

  // GRANULAR BOOKING STATE MANAGEMENT
  const updateBookingState = useCallback((equipmentId: string, dateStr: string, state: {
    isLoading?: boolean;
    data?: any;
    error?: string;
  }) => {
    const key = `${equipmentId}-${dateStr}`;
    setBookingStates(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(key) || { isLoading: false, data: null, lastUpdated: 0 };
      newMap.set(key, {
        ...existing,
        ...state,
        lastUpdated: Date.now()
      });
      return newMap;
    });
  }, []);

  const getBookingState = useCallback((equipmentId: string, dateStr: string) => {
    const key = `${equipmentId}-${dateStr}`;
    return bookingStates.get(key) || { isLoading: false, data: null, lastUpdated: 0 };
  }, [bookingStates]);

  const batchUpdateBookings = useCallback((updates: Array<{
    equipmentId: string;
    dateStr: string;
    state: { isLoading?: boolean; data?: any; error?: string; };
  }>) => {
    setBookingStates(prev => {
      const newMap = new Map(prev);
      updates.forEach(({ equipmentId, dateStr, state }) => {
        const key = `${equipmentId}-${dateStr}`;
        const existing = newMap.get(key) || { isLoading: false, data: null, lastUpdated: 0 };
        newMap.set(key, {
          ...existing,
          ...state,
          lastUpdated: Date.now()
        });
      });
      return newMap;
    });
  }, []);

  const clearStaleStates = useCallback(() => {
    const now = Date.now();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    
    setBookingStates(prev => {
      const newMap = new Map(prev);
      newMap.forEach((value, key) => {
        if (now - value.lastUpdated > staleThreshold) {
          newMap.delete(key);
        }
      });
      return newMap;
    });
  }, []);

  // CONFLICT RESOLUTION FUNCTIONS
  const resolveConflict = useCallback(async (conflictId: string, strategyId: string) => {
    setResolutionInProgress(prev => new Set([...prev, conflictId]));
    
    try {
      // Implementation for conflict resolution
      // This would interact with backend services
      console.log(`Resolving conflict ${conflictId} with strategy ${strategyId}`);
      
      // For now, just mark as resolved after delay
      setTimeout(() => {
        setConflicts(prev => {
          const newMap = new Map(prev);
          const conflict = newMap.get(conflictId);
          if (conflict) {
            newMap.set(conflictId, {
              ...conflict,
              severity: 'resolved',
              resolvedAt: new Date(),
              resolvedBy: 'current-user' // Would come from auth context
            });
          }
          return newMap;
        });
        
        setResolutionInProgress(prev => {
          const newSet = new Set(prev);
          newSet.delete(conflictId);
          return newSet;
        });
      }, 2000);
      
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      setResolutionInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(conflictId);
        return newSet;
      });
    }
  }, []);

  // Initialize default expansions
  useEffect(() => {
    if (equipmentGroups.length > 0) {
      initializeDefaultExpansion(equipmentGroups.map(group => group.mainFolder));
    }
  }, [equipmentGroups, initializeDefaultExpansion]);

  const isLoading = isLoadingEquipment || isLoadingBookings;
  const isEquipmentReady = !!equipmentData;
  const isBookingsReady = !!bookingsData;

  return {
    // Data
    equipmentGroups,
    equipmentById: equipmentData?.equipmentById || new Map(),
    bookingsData: bookingsData || new Map(),
    conflicts,
    
    // Expansion State
    expandedGroups,
    expandedEquipment,
    equipmentProjectUsage,
    
    // Loading States
    isLoading,
    isEquipmentReady,
    isBookingsReady,
    resolutionInProgress,
    
    // Data Access Functions
    getBookingForEquipment,
    getProjectQuantityForDate,
    getLowestAvailable,
    
    // State Management Functions
    toggleGroup: toggleGroupPersistent,
    toggleEquipmentExpansion,
    updateBookingState,
    getBookingState,
    batchUpdateBookings,
    clearStaleStates,
    
    // Conflict Resolution Functions
    resolveConflict,
  };
}