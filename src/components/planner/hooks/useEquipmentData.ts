import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '../../../integrations/supabase/client';
import { EquipmentBooking, EquipmentItem, MainFolder } from '../../../types/equipment';

interface UseEquipmentDataProps {
  periodStart: Date;
  periodEnd: Date;
  selectedOwner?: string;
}

// Virtualization hook for equipment rows
export function useEquipmentVirtualization(containerRef: React.RefObject<HTMLElement>, rowHeight: number = 60, buffer: number = 5) {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  const [totalRows, setTotalRows] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateVisibleRange = () => {
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      
      const start = Math.max(0, Math.floor(scrollTop / rowHeight) - buffer);
      const visibleCount = Math.ceil(containerHeight / rowHeight);
      const end = Math.min(totalRows, start + visibleCount + buffer * 2);
      
      setVisibleRange({ start, end });
    };

    updateVisibleRange();
    container.addEventListener('scroll', updateVisibleRange, { passive: true });
    
    return () => container.removeEventListener('scroll', updateVisibleRange);
  }, [containerRef, rowHeight, buffer, totalRows]);

  const updateTotalRows = (count: number) => setTotalRows(count);

  return { visibleRange, updateTotalRows };
}

// Horizontal virtualization hook for date columns
export function useHorizontalVirtualization(containerRef: React.RefObject<HTMLElement>, columnWidth: number = 50, buffer: number = 10) {
  const [visibleDateRange, setVisibleDateRange] = useState({ start: 0, end: 20 });
  const [totalColumns, setTotalColumns] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateVisibleDateRange = () => {
      const scrollLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;
      
      const start = Math.max(0, Math.floor(scrollLeft / columnWidth) - buffer);
      const visibleCount = Math.ceil(containerWidth / columnWidth);
      const end = Math.min(totalColumns, start + visibleCount + buffer * 2);
      
      setVisibleDateRange({ start, end });
    };

    updateVisibleDateRange();
    container.addEventListener('scroll', updateVisibleDateRange, { passive: true });
    
    return () => container.removeEventListener('scroll', updateVisibleDateRange);
  }, [containerRef, columnWidth, buffer, totalColumns]);

  const updateTotalColumns = (count: number) => setTotalColumns(count);

  return { visibleDateRange, updateTotalColumns };
}

// Granular booking state management hook
export function useGranularBookingState() {
  const [bookingStates, setBookingStates] = useState<Map<string, { 
    isLoading: boolean; 
    data: any; 
    lastUpdated: number;
    error?: string;
  }>>(new Map());

  // Update a specific equipment-date booking
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

  // Get booking state for specific equipment-date
  const getBookingState = useCallback((equipmentId: string, dateStr: string) => {
    const key = `${equipmentId}-${dateStr}`;
    return bookingStates.get(key) || { isLoading: false, data: null, lastUpdated: 0 };
  }, [bookingStates]);

  // Batch update multiple bookings
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

  // Clear old cached states (older than 5 minutes)
  const clearStaleStates = useCallback(() => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    setBookingStates(prev => {
      const newMap = new Map();
      prev.forEach((value, key) => {
        if (value.lastUpdated > fiveMinutesAgo) {
          newMap.set(key, value);
        }
      });
      return newMap;
    });
  }, []);

  return {
    updateBookingState,
    getBookingState,
    batchUpdateBookings,
    clearStaleStates
  };
}

// Helper to flatten equipment structure for virtualization
export function flattenEquipmentStructure(mainFolders: Map<string, MainFolder> | undefined) {
  const flattened: Array<{
    type: 'folder' | 'subfolder' | 'equipment';
    id: string;
    name: string;
    equipment?: EquipmentItem;
    mainFolder?: string;
    subFolder?: string;
    level: number;
  }> = [];

  if (!mainFolders) return flattened;

  let index = 0;
  mainFolders.forEach((mainFolder, mainFolderName) => {
    // Add main folder header
    flattened.push({
      type: 'folder',
      id: `folder-${mainFolderName}`,
      name: mainFolderName,
      level: 0
    });

    // Add equipment directly in main folder
    if (mainFolder.equipment) {
      mainFolder.equipment.forEach((equipment) => {
        flattened.push({
          type: 'equipment',
          id: `equipment-${equipment.id}`,
          name: equipment.name,
          equipment,
          mainFolder: mainFolderName,
          level: 1
        });
      });
    }

    // Add subfolders and their equipment
    if (mainFolder.subfolders) {
      mainFolder.subfolders.forEach((subFolder, subFolderName) => {
        // Add subfolder header
        flattened.push({
          type: 'subfolder',
          id: `subfolder-${mainFolderName}-${subFolderName}`,
          name: subFolderName,
          mainFolder: mainFolderName,
          subFolder: subFolderName,
          level: 1
        });

        // Add equipment in subfolder
        if (subFolder.equipment) {
          subFolder.equipment.forEach((equipment) => {
            flattened.push({
              type: 'equipment',
              id: `equipment-${equipment.id}`,
              name: equipment.name,
              equipment,
              mainFolder: mainFolderName,
              subFolder: subFolderName,
              level: 2
            });
          });
        }
      });
    }
  });

  return flattened;
}

export function useEquipmentData({ periodStart, periodEnd, selectedOwner }: UseEquipmentDataProps) {
  // Always fetch all equipment and folders structure
  const { data: equipmentStructure, isLoading: isLoadingStructure } = useQuery({
    queryKey: ['equipment-structure', selectedOwner],
    queryFn: async () => {
      const [equipmentResult, foldersResult] = await Promise.all([
        // Get all equipment
        supabase
          .from('equipment')
          .select(`
            id,
            name,
            stock,
            folder_id
          `),
        
        // Get all folders
        supabase
          .from('equipment_folders')
          .select('*')
      ]);

      const { data: equipment, error: equipmentError } = equipmentResult;
      const { data: folders, error: foldersError } = foldersResult;

      if (equipmentError) throw equipmentError;
      if (foldersError) throw foldersError;

      // Create folder lookup maps
      const folderMap = new Map(folders?.map(f => [f.id, f]) || []);
      
      // Group equipment by folder hierarchy (main folders and subfolders)
      const mainFoldersMap = new Map<string, MainFolder>();
      
      equipment?.forEach(eq => {
        // Determine folder hierarchy
        const folder = folderMap.get(eq.folder_id);
        const parentFolder = folder?.parent_id ? folderMap.get(folder.parent_id) : null;
        
        // Determine main folder and subfolder
        const mainFolderName = parentFolder?.name || folder?.name || 'Uncategorized';
        const subFolderName = folder?.parent_id ? folder.name : null;
        
        // Get or create main folder
        if (!mainFoldersMap.has(mainFolderName)) {
          mainFoldersMap.set(mainFolderName, {
            name: mainFolderName,
            equipment: new Map(),
            subfolders: new Map()
          });
        }
        
        const mainFolder = mainFoldersMap.get(mainFolderName)!;
        
        // Determine where to place the equipment (main folder or subfolder)
        let targetEquipmentMap: Map<string, EquipmentItem>;
        
        if (subFolderName) {
          // Equipment belongs to a subfolder
          if (!mainFolder.subfolders.has(subFolderName)) {
            mainFolder.subfolders.set(subFolderName, {
              name: subFolderName,
              equipment: new Map()
            });
          }
          targetEquipmentMap = mainFolder.subfolders.get(subFolderName)!.equipment;
        } else {
          // Equipment belongs directly to main folder
          targetEquipmentMap = mainFolder.equipment;
        }
        
        // Add equipment (without bookings initially)
        targetEquipmentMap.set(eq.id, {
          id: eq.id,
          name: eq.name,
          stock: eq.stock || 0,
          bookings: new Map()
        });
      });

      return mainFoldersMap;
    }
  });

  // Optimized booking data fetching with incremental loading
  const { data: bookingsData } = useQuery({
    queryKey: ['equipment-bookings', format(periodStart, 'yyyy-MM-dd'), format(periodEnd, 'yyyy-MM-dd'), selectedOwner],
    queryFn: async () => {
      // Optimized query: Reduce join complexity by querying project_events first
      let baseQuery = supabase
        .from('project_events')
        .select(`
          date,
          name,
          id,
          project:projects!inner (
            name,
            owner_id
          ),
          project_event_equipment!inner (
            equipment_id,
            quantity
          )
        `)
        .gte('date', format(periodStart, 'yyyy-MM-dd'))
        .lte('date', format(periodEnd, 'yyyy-MM-dd'));

      if (selectedOwner) {
        baseQuery = baseQuery.eq('project.owner_id', selectedOwner);
      }

      const { data: eventData, error } = await baseQuery;
      if (error) throw error;

      // Process optimized data structure - flatten equipment bookings from events
      const bookingsByEquipment = new Map<string, Map<string, EquipmentBooking>>();
      
      eventData?.forEach(event => {
        event.project_event_equipment?.forEach(equipmentBooking => {
          const equipmentId = equipmentBooking.equipment_id;
          const date = event.date;
        
        if (!bookingsByEquipment.has(equipmentId)) {
          bookingsByEquipment.set(equipmentId, new Map());
        }
        
          const equipmentBookings = bookingsByEquipment.get(equipmentId)!;
          
          if (!equipmentBookings.has(date)) {
            equipmentBookings.set(date, {
              equipment_id: equipmentId,
              equipment_name: '', // Will be filled from equipment structure
              stock: 0, // Will be filled from equipment structure
              date,
              folder_name: '',
              bookings: [],
              total_used: 0,
              is_overbooked: false
            });
          }
          
          const dateBooking = equipmentBookings.get(date)!;
          dateBooking.bookings.push({
            quantity: equipmentBooking.quantity || 0,
            project_name: event.project.name,
            event_name: event.name
          });
          dateBooking.total_used += equipmentBooking.quantity || 0;
        });
      });

      return bookingsByEquipment;
    },
    enabled: !!equipmentStructure
  });

  // Optimized helper function - takes pre-formatted date string to avoid repeated format() calls
  const getBookingsForEquipment = (equipmentId: string, dateStr: string, equipment: EquipmentItem) => {
    // Get booking from the separate bookings data
    const equipmentBookings = bookingsData?.get(equipmentId);
    const booking = equipmentBookings?.get(dateStr);
    
    if (booking) {
      // Return enriched booking without mutating original object
      return {
        ...booking,
        equipment_name: equipment.name,
        stock: equipment.stock,
        is_overbooked: booking.total_used > equipment.stock
      };
    }
    
    return undefined;
  };

  // Legacy function for backward compatibility (converts Date to string)
  const getBookingsForEquipmentWithDate = (equipmentId: string, date: Date, equipment: EquipmentItem) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return getBookingsForEquipment(equipmentId, dateStr, equipment);
  };

  return {
    mainFolders: equipmentStructure,
    bookingsData,
    isLoading: isLoadingStructure,
    getBookingsForEquipment,
    getBookingsForEquipmentWithDate,
  };
}