import { supabase } from "@/integrations/supabase/client";

/**
 * Calculates Per Gig Average (PGA) for a project
 * PGA = Total cost of all events / Number of events
 * 
 * @param projectId - The project ID to calculate PGA for
 * @returns Promise<number | null> - PGA value or null if no events
 */
export async function calculateProjectPGA(projectId: string): Promise<number | null> {
  try {
    // Fetch all events for the project with their costs
    const { data: events, error } = await supabase
      .from('project_events')
      .select('id, total_price, status')
      .eq('project_id', projectId)
      .not('status', 'eq', 'cancelled'); // Exclude cancelled events

    if (error) {
      console.error('Error fetching events for PGA calculation:', error);
      throw error;
    }

    if (!events || events.length === 0) {
      return null; // No events, no PGA
    }

    // Filter out events with null or undefined total_price
    const validEvents = events.filter(event => 
      event.total_price !== null && 
      event.total_price !== undefined && 
      event.total_price > 0
    );

    if (validEvents.length === 0) {
      return null; // No valid cost data
    }

    // Calculate total cost and average
    const totalCost = validEvents.reduce((sum, event) => sum + (event.total_price || 0), 0);
    const pga = totalCost / validEvents.length;

    return Math.round(pga); // Round to nearest whole number
  } catch (error) {
    console.error('Error in calculateProjectPGA:', error);
    return null;
  }
}

/**
 * Batch calculate PGA for multiple projects
 * More efficient than individual calls when dealing with multiple projects
 * 
 * @param projectIds - Array of project IDs
 * @returns Promise<Record<string, number | null>> - Map of projectId to PGA
 */
export async function calculateBatchPGA(projectIds: string[]): Promise<Record<string, number | null>> {
  try {
    // Fetch all events for all projects in one query
    const { data: events, error } = await supabase
      .from('project_events')
      .select('project_id, total_price, status')
      .in('project_id', projectIds)
      .not('status', 'eq', 'cancelled');

    if (error) {
      console.error('Error fetching events for batch PGA calculation:', error);
      throw error;
    }

    // Group events by project_id
    const eventsByProject = events?.reduce((acc, event) => {
      if (!acc[event.project_id]) {
        acc[event.project_id] = [];
      }
      acc[event.project_id].push(event);
      return acc;
    }, {} as Record<string, typeof events>) || {};

    // Calculate PGA for each project
    const pgaResults: Record<string, number | null> = {};

    projectIds.forEach(projectId => {
      const projectEvents = eventsByProject[projectId] || [];
      
      // Filter valid events
      const validEvents = projectEvents.filter(event => 
        event.total_price !== null && 
        event.total_price !== undefined && 
        event.total_price > 0
      );

      if (validEvents.length === 0) {
        pgaResults[projectId] = null;
      } else {
        const totalCost = validEvents.reduce((sum, event) => sum + (event.total_price || 0), 0);
        pgaResults[projectId] = Math.round(totalCost / validEvents.length);
      }
    });

    return pgaResults;
  } catch (error) {
    console.error('Error in calculateBatchPGA:', error);
    // Return null for all projects on error
    return projectIds.reduce((acc, id) => {
      acc[id] = null;
      return acc;
    }, {} as Record<string, number | null>);
  }
}

/**
 * Formats PGA value for display in Norwegian Kroner
 * 
 * @param pga - PGA value or null
 * @returns string - Formatted display value with "kr" currency
 */
export function formatPGA(pga: number | null): string {
  if (pga === null || pga === undefined) {
    return '—';
  }
  
  // Format as integer (no decimals) with thousands separators and "kr" suffix
  const formatted = Math.round(pga).toLocaleString('no-NO');
  return `${formatted} kr`;
}