import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
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
  // Expansion state management
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

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

  // Fetch booking data with optimized structure
  const { data: bookingsData, isLoading: isLoadingBookings } = useQuery({
    queryKey: [
      'optimized-equipment-bookings', 
      format(periodStart, 'yyyy-MM-dd'), 
      format(periodEnd, 'yyyy-MM-dd'), 
      selectedOwner
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
        .gte('date', format(periodStart, 'yyyy-MM-dd'))
        .lte('date', format(periodEnd, 'yyyy-MM-dd'));

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
    staleTime: 30 * 1000, // 30 seconds - bookings change more frequently
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

  // Optimized booking lookup function
  const getBookingForEquipment = useCallback((equipmentId: string, dateStr: string): EquipmentBookingFlat | undefined => {
    if (!bookingsData) return undefined;
    return bookingsData.get(getBookingKey(equipmentId, dateStr));
  }, [bookingsData]);

  // Calculate lowest stock efficiently
  const getLowestAvailable = useCallback((equipmentId: string, dates: string[]): number => {
    if (!equipmentData?.equipmentById || !bookingsData) {
      return equipmentData?.equipmentById.get(equipmentId)?.stock || 0;
    }
    
    const equipment = equipmentData.equipmentById.get(equipmentId);
    if (!equipment) return 0;
    
    let lowest = equipment.stock;
    
    dates.forEach(dateStr => {
      const booking = bookingsData.get(getBookingKey(equipmentId, dateStr));
      if (booking) {
        const available = equipment.stock - booking.totalUsed;
        lowest = Math.min(lowest, available);
      }
    });
    
    return Math.max(0, lowest);
  }, [equipmentData?.equipmentById, bookingsData]);

  // Group management functions
  const toggleGroup = useCallback((groupKey: string, expandAllSubfolders = false) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      
      if (expandAllSubfolders && !groupKey.includes('/')) {
        // Main folder with modifier key: toggle main folder and all subfolders
        const group = equipmentGroups.find(g => g.mainFolder === groupKey);
        const isMainExpanded = newSet.has(groupKey);
        
        if (isMainExpanded) {
          // Collapse main folder and all subfolders
          newSet.delete(groupKey);
          group?.subFolders.forEach(subFolder => {
            newSet.delete(`${groupKey}/${subFolder.name}`);
          });
        } else {
          // Expand main folder and all subfolders
          newSet.add(groupKey);
          group?.subFolders.forEach(subFolder => {
            newSet.add(`${groupKey}/${subFolder.name}`);
          });
        }
      } else {
        // Normal toggle
        if (newSet.has(groupKey)) {
          newSet.delete(groupKey);
        } else {
          newSet.add(groupKey);
        }
      }
      
      return newSet;
    });
  }, [equipmentGroups]);

  // Initialize expanded state
  useEffect(() => {
    if (equipmentGroups.length > 0 && expandedGroups.size === 0) {
      setExpandedGroups(new Set(equipmentGroups.map(g => g.mainFolder)));
    }
  }, [equipmentGroups, expandedGroups.size]);

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