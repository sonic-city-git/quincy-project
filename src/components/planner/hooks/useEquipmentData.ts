import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '../../../integrations/supabase/client';
import { EquipmentBooking, EquipmentItem, MainFolder } from '../../../types/equipment';

interface UseEquipmentDataProps {
  periodStart: Date;
  periodEnd: Date;
  selectedOwner?: string;
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

  // Fetch booking data only for the timeline range
  const { data: bookingsData } = useQuery({
    queryKey: ['equipment-bookings', format(periodStart, 'yyyy-MM-dd'), format(periodEnd, 'yyyy-MM-dd'), selectedOwner],
    queryFn: async () => {
      let query = supabase
        .from('project_event_equipment')
        .select(`
          equipment_id,
          quantity,
          project_events!inner (
            date,
            name,
            project:projects!inner (
              name,
              owner_id
            )
          )
        `)
        .gte('project_events.date', format(periodStart, 'yyyy-MM-dd'))
        .lte('project_events.date', format(periodEnd, 'yyyy-MM-dd'));

      if (selectedOwner) {
        query = query.eq('project_events.project.owner_id', selectedOwner);
      }

      const { data: bookings, error } = await query;
      if (error) throw error;

      // Group bookings by equipment and date
      const bookingsByEquipment = new Map<string, Map<string, EquipmentBooking>>();
      
      bookings?.forEach(booking => {
        const equipmentId = booking.equipment_id;
        const date = booking.project_events.date;
        
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
          quantity: booking.quantity || 0,
          project_name: booking.project_events.project.name,
          event_name: booking.project_events.name
        });
        dateBooking.total_used += booking.quantity || 0;
      });

      return bookingsByEquipment;
    },
    enabled: !!equipmentStructure
  });

  // Helper function to get bookings for equipment
  const getBookingsForEquipment = (equipmentId: string, date: Date, equipment: EquipmentItem) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Get booking from the separate bookings data
    const equipmentBookings = bookingsData?.get(equipmentId);
    const booking = equipmentBookings?.get(dateStr);
    
    if (booking) {
      // Fill in equipment details
      booking.equipment_name = equipment.name;
      booking.stock = equipment.stock;
      booking.is_overbooked = booking.total_used > equipment.stock;
      return booking;
    }
    
    return undefined;
  };

  return {
    mainFolders: equipmentStructure,
    bookingsData,
    isLoading: isLoadingStructure,
    getBookingsForEquipment,
  };
}