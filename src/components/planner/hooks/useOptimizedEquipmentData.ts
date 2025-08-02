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
  sortEquipmentInGroup
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

  // Use actual period dates with minimal buffering for infinite scroll
  const stableDataRange = useMemo(() => {
    // Add small buffer for smoother scrolling (3 days on each side)
    const bufferedStart = addDays(periodStart, -3);
    const bufferedEnd = addDays(periodEnd, 3);
    
    return {
      start: bufferedStart,
      end: bufferedEnd
    };
  }, [
    format(periodStart, 'yyyy-MM-dd'),
    format(periodEnd, 'yyyy-MM-dd')
  ]); // Track actual date changes, not just month

  // Fetch equipment structure with optimized transformation
  const { data: equipmentData, isLoading: isLoadingEquipment } = useQuery({
    queryKey: ['optimized-equipment-structure', selectedOwner],
    queryFn: async (): Promise<{ 
      flattenedEquipment: FlattenedEquipment[];
      equipmentById: Map<string, FlattenedEquipment>;
    }> => {
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

      return { flattenedEquipment, equipmentById };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - equipment doesn't change often
  });

  // Fetch booking data with keepPreviousData to prevent loading states during expansion
  const { data: bookingsData, isLoading: isLoadingBookings } = useQuery({
    queryKey: [
      'optimized-equipment-bookings', 
      format(stableDataRange.start, 'yyyy-MM-dd'), // Use actual dates for infinite scroll
      format(stableDataRange.end, 'yyyy-MM-dd'),   // This tracks timeline expansions
      selectedOwner,
      'v4' // Version key updated for new date tracking
    ],
    queryFn: async (): Promise<Map<string, EquipmentBookingFlat>> => {
      let baseQuery = supabase
        .from('project_events')
        .select(`
          date,
          name,
          project:projects!inner (
            name,
            owner_id
          ),
          project_event_equipment!inner (
            equipment_id,
            quantity
          )
        `)
        .gte('date', format(stableDataRange.start, 'yyyy-MM-dd'))
        .lte('date', format(stableDataRange.end, 'yyyy-MM-dd'));

      if (selectedOwner) {
        baseQuery = baseQuery.eq('project.owner_id', selectedOwner);
      }

      const { data: eventData, error } = await baseQuery;
      if (error) throw error;

      // Transform to optimized booking structure
      const bookingsByKey = new Map<string, EquipmentBookingFlat>();
      
      eventData?.forEach(event => {
        event.project_event_equipment?.forEach(equipmentBooking => {
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
      });

      return bookingsByKey;
    },
    enabled: !!equipmentData,
    staleTime: 5 * 60 * 1000, // 5 minutes - longer for year transitions
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    keepPreviousData: true, // Prevent loading states during timeline expansion
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
  
  const periodStartRef = useRef(periodStart);
  periodStartRef.current = periodStart;
  
  const periodEndRef = useRef(periodEnd);
  periodEndRef.current = periodEnd;
  
  const getBookingForEquipment = useCallback((equipmentId: string, dateStr: string): EquipmentBookingFlat | undefined => {
    if (!bookingsDataRef.current) return undefined;
    
    // Filter to only return data within the actual period range (not the full month range)
    const requestDate = new Date(dateStr);
    if (requestDate < periodStartRef.current || requestDate > periodEndRef.current) {
      return undefined;
    }
    
    return bookingsDataRef.current.get(getBookingKey(equipmentId, dateStr));
  }, []); // No dependencies - function never changes reference

  // Stabilize lowest available calculation to prevent cascade re-renders
  const equipmentDataRef = useRef(equipmentData);
  equipmentDataRef.current = equipmentData;
  
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

  return {
    equipmentGroups,
    equipmentById: equipmentData?.equipmentById || new Map(),
    bookingsData: bookingsData || new Map(),
    expandedGroups,
    isLoading,
    getBookingForEquipment,
    getLowestAvailable,
    toggleGroup,
  };
}