import { supabase } from "@/integrations/supabase/client";

export interface CrewConflictResult {
  hasConflict: boolean;
  conflictingEvents: Array<{
    eventId: string;
    eventName: string;
    projectName: string;
    date: string;
  }>;
}

/**
 * Check if a crew member has existing assignments on the given dates
 * Used to prevent double-booking when syncing preferred crew
 */
export async function checkCrewConflicts(
  crewMemberId: string, 
  dates: string[]
): Promise<CrewConflictResult> {
  try {
    // Format dates as YYYY-MM-DD for database query
    const formattedDates = dates.map(date => {
      // Handle both Date objects and date strings
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toISOString().split('T')[0]; // Extract YYYY-MM-DD
    });

    // Get all existing assignments for this crew member on these dates
    const { data: existingAssignments, error } = await supabase
      .from('project_event_roles')
      .select(`
        event_id,
        project_events!inner (
          id,
          name,
          date,
          projects (
            name
          )
        )
      `)
      .eq('crew_member_id', crewMemberId)
      .in('project_events.date', formattedDates);

    if (error) {
      console.error('Error checking crew conflicts:', error);
      throw error;
    }

    const conflictingEvents = (existingAssignments || []).map(assignment => ({
      eventId: assignment.project_events.id,
      eventName: assignment.project_events.name,
      projectName: assignment.project_events.projects?.name || 'Unknown Project',
      date: assignment.project_events.date
    }));

    return {
      hasConflict: conflictingEvents.length > 0,
      conflictingEvents
    };
  } catch (error) {
    console.error('Error in checkCrewConflicts:', error);
    return {
      hasConflict: false,
      conflictingEvents: []
    };
  }
}

/**
 * Check conflicts for multiple crew members across multiple dates
 * Returns a map of crewMemberId -> conflict results
 */
export async function checkMultipleCrewConflicts(
  assignments: Array<{ crewMemberId: string; date: string }>
): Promise<Map<string, CrewConflictResult>> {
  const resultMap = new Map<string, CrewConflictResult>();
  
  // Group assignments by crew member
  const assignmentsByMember = new Map<string, string[]>();
  assignments.forEach(({ crewMemberId, date }) => {
    if (!assignmentsByMember.has(crewMemberId)) {
      assignmentsByMember.set(crewMemberId, []);
    }
    assignmentsByMember.get(crewMemberId)!.push(date);
  });

  // Check conflicts for each crew member
  await Promise.all(
    Array.from(assignmentsByMember.entries()).map(async ([crewMemberId, dates]) => {
      const result = await checkCrewConflicts(crewMemberId, dates);
      resultMap.set(crewMemberId, result);
    })
  );

  return resultMap;
}
