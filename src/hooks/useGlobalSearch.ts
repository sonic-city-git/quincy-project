import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/utils/priceFormatters";
import { getWarningTimeframe, OVERBOOKING_WARNING_DAYS } from "@/constants/timeframes";

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: 'project' | 'crew' | 'equipment';
  avatar_url?: string;
  color?: string;
  route: string;
  warning?: {
    text: string;
    type: 'overbooked' | 'fully_booked' | 'out_of_stock' | 'low_stock';
    route?: string;
  };
}

export interface GlobalSearchResults {
  projects: SearchResult[];
  crew: SearchResult[];
  equipment: SearchResult[];
  total: number;
}

export function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: ['global-search', query],
    queryFn: async (): Promise<GlobalSearchResults> => {
      if (!query || query.length < 2) {
        return {
          projects: [],
          crew: [],
          equipment: [],
          total: 0
        };
      }

      const searchTerm = `%${query.toLowerCase()}%`;

      // Search projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          color,
          project_number
        `)
        .ilike('name', searchTerm)
        .eq('is_archived', false)
        .limit(5);

      if (projectsError) {
        console.error('Error searching projects:', projectsError);
      }

      // Search crew members
      const { data: crewData, error: crewError } = await supabase
        .from('crew_members')
        .select('id, name, avatar_url')
        .ilike('name', searchTerm)
        .limit(5);

      if (crewError) {
        console.error('Error searching crew:', crewError);
      }

      // Search equipment - basic search first
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipment')
        .select('id, name, rental_price, stock')
        .ilike('name', searchTerm)
        .limit(5);

      if (equipmentError) {
        console.error('Error searching equipment:', equipmentError);
      }

      // Define global timeframe for overbooking warnings
      const { startDate, endDate } = getWarningTimeframe();

      // Check for equipment overbookings in parallel
      const equipmentWithBookings = await Promise.all(
        (equipmentData || []).map(async (item) => {
          try {
            // Get total bookings for this equipment in the timeframe
            const { data: bookings, error: bookingError } = await supabase
              .from('project_equipment')
              .select(`
                quantity,
                project_events!inner (
                  date,
                  status
                )
              `)
              .eq('equipment_id', item.id)
              .gte('project_events.date', startDate)
              .lte('project_events.date', endDate)
              .in('project_events.status', ['confirmed', 'active']);

            if (bookingError) {
              console.error('Error fetching bookings for equipment:', item.name, bookingError);
              return { ...item, totalBooked: 0 };
            }

            // Calculate total quantity booked
            const totalBooked = (bookings || []).reduce((sum, booking) => sum + (booking.quantity || 0), 0);
            
            return { ...item, totalBooked };
          } catch (error) {
            console.error('Error checking bookings for equipment:', item.name, error);
            return { ...item, totalBooked: 0 };
          }
        })
      );

      // Transform results
      const projects: SearchResult[] = (projectsData || []).map(project => ({
        id: project.id,
        title: project.name,
        subtitle: `Project #${project.project_number}`,
        type: 'project' as const,
        color: project.color,
        route: `/projects/${project.id}`
      }));

      const crew: SearchResult[] = (crewData || []).map(member => ({
        id: member.id,
        title: member.name,
        subtitle: 'Crew Member',
        type: 'crew' as const,
        avatar_url: member.avatar_url,
        route: `/crew/${member.id}` // Note: This route may not exist yet
      }));

      const equipment: SearchResult[] = equipmentWithBookings.map(item => {
        let warning: SearchResult['warning'] = undefined;
        
        // Only show warnings for actual OVERBOOKINGS (negative conflicts requiring action)
        if (item.totalBooked > 0 && item.stock !== null && item.totalBooked > item.stock) {
          warning = {
            text: 'Fix Problem',
            type: 'overbooked',
            route: `/planner?equipment=${item.id}&conflict=overbooked`
          };
        }
        
        // Format rental price
        const priceText = item.rental_price ? `${formatPrice(item.rental_price)}/day` : 'No rate set';
        
        // Format stock info with booking context when relevant
        let stockText = item.stock !== null ? `Stock: ${item.stock}` : 'Stock: Unknown';
        
        // Add booking context if there are bookings in the timeframe
        if (item.totalBooked > 0) {
          stockText += ` • ${item.totalBooked} booked (next ${OVERBOOKING_WARNING_DAYS} days)`;
        }
        
        return {
          id: item.id,
          title: item.name,
          subtitle: `${priceText} • ${stockText}`,
          type: 'equipment' as const,
          route: `/equipment/${item.id}`, // Note: This route may not exist yet
          warning
        };
      });

      return {
        projects,
        crew,
        equipment,
        total: projects.length + crew.length + equipment.length
      };
    },
    enabled: Boolean(query && query.length >= 2),
    staleTime: 300000, // 5 minutes
  });
}