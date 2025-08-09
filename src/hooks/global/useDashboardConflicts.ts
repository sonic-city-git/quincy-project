/**
 * DASHBOARD-SPECIFIC CONFLICT DETECTION
 * 
 * Critical fix: Fetches ALL equipment conflicts regardless of planner folder expansion state.
 * The main useTimelineHub only fetches data for expanded folders, which makes dashboard 
 * conflict detection incomplete and misleading.
 * 
 * This hook provides complete, reliable conflict detection for dashboard metrics.
 */

import { useQuery } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { OVERBOOKING_WARNING_DAYS, getWarningTimeframe } from '@/constants/timeframes';

interface EquipmentConflict {
  equipmentId: string;
  equipmentName: string;
  date: string;
  totalStock: number;
  totalUsed: number;
  overbooked: number;
  conflictingEvents: {
    eventName: string;
    projectName: string;
    quantity: number;
  }[];
}

interface CrewConflict {
  crewMemberId: string;
  crewMemberName: string;
  date: string;
  conflictingAssignments: {
    eventName: string;
    projectName: string;
    role: string;
  }[];
}

export function useDashboardConflicts(selectedOwner?: string) {
  const { startDate, endDate } = getWarningTimeframe();

  const { data: equipmentConflicts, isLoading: isLoadingEquipment } = useQuery({
    queryKey: ['dashboard-equipment-conflicts', startDate, endDate, selectedOwner],
    queryFn: async () => {
      // Step 1: Get ALL equipment (not filtered by expansion state)
      const { data: equipment, error: equipmentError } = await supabase
        .from('equipment')
        .select('id, name, stock');

      if (equipmentError) throw equipmentError;

      // Step 2: Get events in the warning timeframe
      let eventsQuery = supabase
        .from('project_events')
        .select(`
          id, date, name, project_id,
          project:projects!inner (name, owner_id)
        `)
        .gte('date', startDate)
        .lte('date', endDate);

      if (selectedOwner) {
        eventsQuery = eventsQuery.eq('project.owner_id', selectedOwner);
      }

      const { data: events, error: eventsError } = await eventsQuery;
      if (eventsError) throw eventsError;
      if (!events?.length) return [];

      // Step 3: Get ALL equipment bookings for these events
      const { data: bookings, error: bookingsError } = await supabase
        .from('project_event_equipment')
        .select('event_id, equipment_id, quantity')
        .in('event_id', events.map(e => e.id));

      if (bookingsError) throw bookingsError;

      // Step 4: Process conflicts
      const equipmentMap = new Map(equipment?.map(eq => [eq.id, eq]) || []);
      const eventMap = new Map(events.map(e => [e.id, e]));
      
      // Group bookings by equipment and date
      const bookingsByEquipmentAndDate = new Map<string, {
        equipment: any;
        date: string;
        bookings: Array<{
          quantity: number;
          eventName: string;
          projectName: string;
        }>;
        totalUsed: number;
      }>();

      bookings?.forEach(booking => {
        const event = eventMap.get(booking.event_id);
        const equipment = equipmentMap.get(booking.equipment_id);
        
        if (!event || !equipment) return;
        
        const key = `${booking.equipment_id}-${event.date}`;
        
        if (!bookingsByEquipmentAndDate.has(key)) {
          bookingsByEquipmentAndDate.set(key, {
            equipment,
            date: event.date,
            bookings: [],
            totalUsed: 0
          });
        }
        
        const dayBooking = bookingsByEquipmentAndDate.get(key)!;
        dayBooking.bookings.push({
          quantity: booking.quantity || 0,
          eventName: event.name,
          projectName: event.project.name
        });
        dayBooking.totalUsed += booking.quantity || 0;
      });

      // Step 5: Identify conflicts (where totalUsed > stock)
      const conflicts: EquipmentConflict[] = [];
      
      bookingsByEquipmentAndDate.forEach(dayBooking => {
        if (dayBooking.totalUsed > dayBooking.equipment.stock) {
          conflicts.push({
            equipmentId: dayBooking.equipment.id,
            equipmentName: dayBooking.equipment.name,
            date: dayBooking.date,
            totalStock: dayBooking.equipment.stock,
            totalUsed: dayBooking.totalUsed,
            overbooked: dayBooking.totalUsed - dayBooking.equipment.stock,
            conflictingEvents: dayBooking.bookings
          });
        }
      });

      return conflicts;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
    retry: 1,
    enabled: true // Always enabled for planner usage
  });

  const { data: crewConflicts, isLoading: isLoadingCrew } = useQuery({
    queryKey: ['dashboard-crew-conflicts', startDate, endDate, selectedOwner],
    queryFn: async () => {
      // Get crew double-bookings
      let rolesQuery = supabase
        .from('project_event_roles')
        .select(`
          id, crew_member_id, role_id,
          project_events!inner (
            date, name, project_id,
            project:projects!inner (name, owner_id)
          ),
          crew_members!inner (name),
          crew_roles (name)
        `)
        .not('crew_member_id', 'is', null)
        .gte('project_events.date', startDate)
        .lte('project_events.date', endDate);

      if (selectedOwner) {
        rolesQuery = rolesQuery.eq('project_events.project.owner_id', selectedOwner);
      }

      const { data: roles, error } = await rolesQuery;
      if (error) throw error;
      
      // Debug logging for crew conflicts
      if (process.env.NODE_ENV === 'development') {
        console.log('👥 Crew roles fetched for conflicts:', roles?.length || 0);
        console.log('📅 Date range:', { startDate, endDate });
        if (selectedOwner) console.log('👤 Owner filter:', selectedOwner);
      }
      
      if (!roles?.length) return [];

      // Group by crew member and date
      const assignmentsByMemberAndDate = new Map<string, {
        crewMember: any;
        date: string;
        assignments: Array<{
          eventName: string;
          projectName: string;
          role: string;
        }>;
      }>();

      roles.forEach(role => {
        if (!role.crew_member_id || !role.project_events) return;
        
        const key = `${role.crew_member_id}-${role.project_events.date}`;
        
        if (!assignmentsByMemberAndDate.has(key)) {
          assignmentsByMemberAndDate.set(key, {
            crewMember: role.crew_members,
            date: role.project_events.date,
            assignments: []
          });
        }
        
        const dayAssignment = assignmentsByMemberAndDate.get(key)!;
        dayAssignment.assignments.push({
          eventName: role.project_events.name,
          projectName: role.project_events.project.name,
          role: role.crew_roles?.name || 'Unknown'
        });
      });

      // Find double-bookings (more than 1 assignment per day)
      const conflicts: CrewConflict[] = [];
      
      assignmentsByMemberAndDate.forEach(dayAssignment => {
        if (dayAssignment.assignments.length > 1) {
          conflicts.push({
            crewMemberId: dayAssignment.crewMember.id,
            crewMemberName: dayAssignment.crewMember.name,
            date: dayAssignment.date,
            conflictingAssignments: dayAssignment.assignments
          });
        }
      });

      // Debug logging for crew conflicts
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ Crew conflicts found:', conflicts.length);
        console.log('📊 Total assignment days processed:', assignmentsByMemberAndDate.size);
        if (conflicts.length > 0) {
          console.log('🚨 Crew conflicts details:', conflicts);
        }
      }

      return conflicts;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
    retry: 1,
    enabled: true // Always enabled for planner usage
  });

  return {
    equipmentConflicts: equipmentConflicts || [],
    crewConflicts: crewConflicts || [],
    equipmentConflictCount: equipmentConflicts?.length || 0,
    crewConflictCount: crewConflicts?.length || 0,
    isLoading: isLoadingEquipment || isLoadingCrew,
    error: null
  };
}