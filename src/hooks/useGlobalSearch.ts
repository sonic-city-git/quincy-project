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
  roles?: Array<{ name: string; color: string }>; // For crew members with colors
  warning?: {
    text: string;
    type: 'overbooked' | 'fully_booked' | 'out_of_stock' | 'low_stock' | 'double_booked' | 'missing_roles' | 'equipment_conflicts';
    route?: string;
  };
  availabilityAction?: {
    route: string;
  };
  primaryAction?: {
    type: 'email';
    href: string;
  } | null;
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

      // Search crew members (basic search first)
      const { data: crewData, error: crewError } = await supabase
        .from('crew_members')
        .select(`
          id, 
          name, 
          avatar_url, 
          email,
          crew_folders (
            name
          )
        `)
        .ilike('name', searchTerm)
        .limit(5);

      if (crewError) {
        console.error('Error searching crew:', crewError);
      }

      // Fetch roles for the found crew members
      let crewDataWithRoles = crewData || [];
      if (crewData && crewData.length > 0) {
        try {
          const crewIds = crewData.map(c => c.id);
          
          // Fetch crew member roles and crew roles separately
          const [crewMemberRolesResult, crewRolesResult] = await Promise.all([
            supabase.from('crew_member_roles').select('*').in('crew_member_id', crewIds),
            supabase.from('crew_roles').select('id, name, color')
          ]);

          if (crewMemberRolesResult.error) {
            console.error('Error fetching crew member roles:', crewMemberRolesResult.error);
          }
          if (crewRolesResult.error) {
            console.error('Error fetching crew roles:', crewRolesResult.error);
          }

          // Create lookup maps
          const roleIdToRole = new Map(
            (crewRolesResult.data || []).map(role => [role.id, { name: role.name, color: role.color }])
          );
          
          const memberIdToRoles = new Map<string, Array<{ name: string; color: string }>>();
          (crewMemberRolesResult.data || []).forEach(cmr => {
            if (cmr.crew_member_id && cmr.role_id) {
              const roleData = roleIdToRole.get(cmr.role_id);
              if (roleData) {
                if (!memberIdToRoles.has(cmr.crew_member_id)) {
                  memberIdToRoles.set(cmr.crew_member_id, []);
                }
                memberIdToRoles.get(cmr.crew_member_id)!.push(roleData);
              }
            }
          });

          // Map crew data with roles
          crewDataWithRoles = crewData.map(member => ({
            ...member,
            crew_member_roles: memberIdToRoles.get(member.id) || []
          }));
        } catch (error) {
          console.error('Error fetching crew roles:', error);
          // Continue with basic crew data if roles fetch fails
        }
      }

      // Define global timeframe for all warnings (crew, equipment, projects)
      const { startDate, endDate } = getWarningTimeframe();

      // First get events in the timeframe for crew conflicts
      const { data: eventsForCrew, error: crewEventsError } = await supabase
        .from('project_events')
        .select('id, date')
        .gte('date', startDate)
        .lte('date', endDate)
        .in('status', ['confirmed', 'active']);

      if (crewEventsError) {
        console.error('Error fetching events for crew conflict check:', crewEventsError);
      }

      const crewEventIds = eventsForCrew?.map(e => e.id) || [];
      const crewEventDateMap = new Map(eventsForCrew?.map(e => [e.id, e.date]) || []);

      // Check for crew double-bookings in parallel
      const crewWithConflicts = await Promise.all(
        crewDataWithRoles.map(async (member) => {
          try {
            if (crewEventIds.length === 0) {
              return { ...member, conflictDays: 0 };
            }

            // Get all assignments for this crew member in the timeframe
            const { data: assignments, error: assignmentError } = await supabase
              .from('project_event_roles')
              .select('event_id')
              .eq('crew_member_id', member.id)
              .in('event_id', crewEventIds);

            if (assignmentError) {
              console.error('Error fetching assignments for crew:', member.name, assignmentError);
              return { ...member, conflictDays: 0 };
            }

            // Group assignments by date to detect conflicts
            const assignmentsByDate = new Map<string, number>();
            (assignments || []).forEach(assignment => {
              const date = crewEventDateMap.get(assignment.event_id);
              if (date) {
                assignmentsByDate.set(date, (assignmentsByDate.get(date) || 0) + 1);
              }
            });

            // Count days with conflicts (multiple assignments same day)
            const conflictDays = Array.from(assignmentsByDate.values()).filter(count => count > 1).length;
            
            return { ...member, conflictDays };
          } catch (error) {
            console.error('Error checking conflicts for crew:', member.name, error);
            return { ...member, conflictDays: 0 };
          }
        })
      );

      // Search equipment - basic search first
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipment')
        .select('id, name, rental_price, stock')
        .ilike('name', searchTerm)
        .limit(5);

      if (equipmentError) {
        console.error('Error searching equipment:', equipmentError);
      }

      // Check for equipment overbookings in parallel
      const equipmentWithBookings = await Promise.all(
        (equipmentData || []).map(async (item) => {
          try {
            // Get total bookings for this equipment in the timeframe
            // First get events in the timeframe
            const { data: eventsInRange, error: eventsError } = await supabase
              .from('project_events')
              .select('id')
              .gte('date', startDate)
              .lte('date', endDate)
              .in('status', ['confirmed', 'active']);

            if (eventsError) {
              console.error('Error fetching events:', eventsError);
              return { ...item, totalBooked: 0 };
            }

            const eventIds = eventsInRange?.map(e => e.id) || [];
            
            if (eventIds.length === 0) {
              return { ...item, totalBooked: 0 };
            }

            // Then get bookings for this equipment in those events
            const { data: bookings, error: bookingError } = await supabase
              .from('project_event_equipment')
              .select('quantity')
              .eq('equipment_id', item.id)
              .in('event_id', eventIds);

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

      // Check for project issues in parallel
      const projectsWithIssues = await Promise.all(
        (projectsData || []).map(async (project) => {
          try {
            // Get upcoming events for this project
            const { data: events, error: eventsError } = await supabase
              .from('project_events')
              .select(`
                id,
                date,
                name,
                status
              `)
              .eq('project_id', project.id)
              .gte('date', startDate)
              .lte('date', endDate)
              .in('status', ['confirmed', 'active']);

            if (eventsError) {
              console.error('Error fetching events for project:', project.name, eventsError);
              return { ...project, missingRoles: 0, equipmentConflicts: 0 };
            }

            if (!events || events.length === 0) {
              return { ...project, missingRoles: 0, equipmentConflicts: 0 };
            }

            const eventIds = events.map(e => e.id);

            // Check for unassigned roles
            const { data: unassignedRoles, error: rolesError } = await supabase
              .from('project_event_roles')
              .select('id')
              .in('event_id', eventIds)
              .is('crew_member_id', null);

            if (rolesError) {
              console.error('Error fetching unassigned roles for project:', project.name, rolesError);
            }

            // Check for equipment conflicts using project_event_equipment
            const { data: equipmentUsage, error: equipmentError } = await supabase
              .from('project_event_equipment')
              .select(`
                equipment_id,
                quantity,
                event_id,
                equipment!inner (
                  stock
                )
              `)
              .in('event_id', eventIds);

            let equipmentConflicts = 0;
            if (!equipmentError && equipmentUsage) {
              // Create a map of event_id to date from the events we fetched
              const eventDateMap = new Map(events.map(e => [e.id, e.date]));
              
              // Group by equipment and date to check for overbookings
              const usageByDateAndEquipment = new Map<string, Map<string, { totalUsed: number, stock: number }>>();
              
              equipmentUsage.forEach(usage => {
                const date = eventDateMap.get(usage.event_id);
                const equipmentId = usage.equipment_id;
                const quantity = usage.quantity || 0;
                const stock = usage.equipment?.stock || 0;

                if (!date) return; // Skip if we can't find the date

                if (!usageByDateAndEquipment.has(date)) {
                  usageByDateAndEquipment.set(date, new Map());
                }

                const dateMap = usageByDateAndEquipment.get(date)!;
                if (!dateMap.has(equipmentId)) {
                  dateMap.set(equipmentId, { totalUsed: 0, stock });
                }

                const current = dateMap.get(equipmentId)!;
                current.totalUsed += quantity;
              });

              // Count conflicts where total used > stock
              usageByDateAndEquipment.forEach((equipmentMap) => {
                equipmentMap.forEach((usage) => {
                  if (usage.totalUsed > usage.stock) {
                    equipmentConflicts++;
                  }
                });
              });
            }

            return { 
              ...project, 
              missingRoles: (unassignedRoles || []).length,
              equipmentConflicts
            };
          } catch (error) {
            console.error('Error checking issues for project:', project.name, error);
            return { ...project, missingRoles: 0, equipmentConflicts: 0 };
          }
        })
      );

      // Transform results
      const projects: SearchResult[] = projectsWithIssues.map(project => {
        let warning: SearchResult['warning'] = undefined;
        
        const totalIssues = project.missingRoles + project.equipmentConflicts;
        if (totalIssues > 0) {
          const issues = [];
          if (project.missingRoles > 0) {
            issues.push(`${project.missingRoles} missing role${project.missingRoles > 1 ? 's' : ''}`);
          }
          if (project.equipmentConflicts > 0) {
            issues.push(`${project.equipmentConflicts} equipment conflict${project.equipmentConflicts > 1 ? 's' : ''}`);
          }

          warning = {
            text: `Fix Problem: ${issues.join(', ')}`,
            type: project.missingRoles > 0 ? 'missing_roles' : 'equipment_conflicts',
            route: `/planner?project=${project.id}`
          };
        }

        return {
          id: project.id,
          title: project.name,
          subtitle: `Project #${project.project_number}`,
          type: 'project' as const,
          color: project.color,
          route: `/projects/${project.id}`,
          warning
        };
      });

      const crew: SearchResult[] = crewWithConflicts.map(member => {
        let warning: SearchResult['warning'] = undefined;
        
        if (member.conflictDays > 0) {
          warning = {
            text: `Fix Problem: ${member.conflictDays} double-booking${member.conflictDays > 1 ? 's' : ''}`,
            type: 'double_booked',
            route: `/planner?crew=${member.id}`
          };
        }

        // Extract role data from the mapped data
        const roles = member.crew_member_roles || [];

        return {
          id: member.id,
          title: member.name,
          subtitle: member.crew_folders?.name || 'Crew Member',
          type: 'crew' as const,
          avatar_url: member.avatar_url,
          roles,
          route: `/resources?type=crew&scrollTo=${member.id}`,
          warning,
          availabilityAction: {
            route: `/planner?crew=${member.id}`
          },
          primaryAction: member.email ? {
            type: 'email',
            href: `mailto:${member.email}?subject=Production Assignment&body=Hi ${member.name},%0A%0A`
          } : null
        };
      });

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
          route: `/resources?type=equipment&scrollTo=${item.id}`,
          warning,
          availabilityAction: {
            route: `/planner?equipment=${item.id}`
          },
          primaryAction: null // Unused for equipment for now
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