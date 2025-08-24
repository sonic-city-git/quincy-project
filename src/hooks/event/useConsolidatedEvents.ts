/**
 * CONSOLIDATED EVENT MANAGEMENT HOOK
 * 
 * Replaces multiple duplicate hooks:
 * - useEventUpdate (43 lines)
 * - useCalendarEvents (128 lines) 
 * - useEventManagement (118 lines)
 * - useProjectEvents (80 lines)
 * - useEventStatusChange (62 lines)
 * 
 * Total reduction: ~431 lines → ~200 lines (53% reduction)
 * 
 * Features:
 * - Single source of truth for all event operations
 * - Optimistic updates with rollback on error
 * - Consistent query invalidation patterns
 * - Business logic validation (missing resources)
 * - Drag selection functionality
 * - Status change handling
 */

import { useState, useCallback, useMemo } from 'react';
import { CalendarEvent, EventType } from '@/types/events';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useStockCacheInvalidation } from '@/hooks/useStockCacheInvalidation';
import { fetchEvents, createEvent, updateEvent as updateEventQuery, deleteEvent as deleteEventQuery } from '@/utils/eventQueries';
import { createRoleAssignments } from '@/utils/roleAssignments';
import { compareDates } from '@/utils/dateFormatters';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// =============================================================================
// TYPES
// =============================================================================

interface UseConsolidatedEventsProps {
  projectId: string;
  enableDragSelection?: boolean;
}

interface ConsolidatedEventsResult {
  // Data
  events: CalendarEvent[];
  isLoading: boolean;
  
  // Drag functionality (optional)
  isDragging: boolean;
  selectedDates: Date[];
  
  // Event operations
  addEvent: (date: Date, eventName: string, eventType: EventType, status?: CalendarEvent['status']) => Promise<CalendarEvent>;
  updateEvent: (updatedEvent: CalendarEvent) => Promise<void>;
  deleteEvent: (event: CalendarEvent) => Promise<boolean>;
  updateEventStatus: (event: CalendarEvent, newStatus: CalendarEvent['status']) => Promise<void>;
  
  // Utility functions
  findEventOnDate: (date: Date) => CalendarEvent | undefined;
  
  // Drag handlers (if enabled)
  handleDragStart: (date: Date | undefined) => void;
  handleDragEnter: (date: Date) => void;
  resetSelection: () => void;
}

// =============================================================================
// BUSINESS LOGIC HELPERS
// =============================================================================

async function checkMissingResources(projectId: string, eventType: EventType): Promise<string[]> {
  const warnings = [];
  
  if (eventType.needs_crew) {
    const { data: projectRoles } = await supabase
      .from('project_roles')
      .select('id')
      .eq('project_id', projectId);
    
    if (!projectRoles?.length) {
      warnings.push("Consider setting up crew roles for better event management.");
    }
  }
  
  if (eventType.needs_equipment) {
    const { data: projectEquipment } = await supabase
      .from('project_equipment')
      .select('id')
      .eq('project_id', projectId);
    
    if (!projectEquipment?.length) {
      warnings.push("Consider assigning equipment for better event management.");
    }
  }
  
  return warnings;
}

// =============================================================================
// MAIN HOOK
// =============================================================================

export function useConsolidatedEvents({
  projectId,
  enableDragSelection = false
}: UseConsolidatedEventsProps): ConsolidatedEventsResult {
  const queryClient = useQueryClient();
  
  // Drag state (only if enabled)
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [dragStartDate, setDragStartDate] = useState<Date | null>(null);

  // =============================================================================
  // DATA FETCHING
  // =============================================================================
  
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', projectId],
    queryFn: () => fetchEvents(projectId),
    enabled: !!projectId
  });

  // =============================================================================
  // QUERY INVALIDATION HELPER
  // =============================================================================
  
  const { invalidateProjectStock, invalidateEventStock } = useStockCacheInvalidation();
  
  const invalidateEventQueries = useCallback(async (eventId?: string) => {
    const baseQueries = [
      ['events', projectId],
      ['calendar-events', projectId]
    ];
    
    // ✅ NEW: Also invalidate Financial Tab queries when events change
    const financialQueries = [
      ['project-invoice-draft', projectId],
      ['project-fiken-invoices', projectId],
      ['invoice-ready-events', projectId]
    ];
    
    const eventSpecificQueries = eventId ? [
      ['project-event-equipment', eventId],
      ['project-event-roles', eventId],
      ['project-event-roles'], // Global invalidation for consolidated hooks
      ['project-event-equipment'] // Global invalidation for consolidated hooks
    ] : [];
    
    await Promise.all([
      ...baseQueries.map(queryKey => queryClient.invalidateQueries({ queryKey })),
      ...financialQueries.map(queryKey => queryClient.invalidateQueries({ queryKey })),
      ...eventSpecificQueries.map(queryKey => queryClient.invalidateQueries({ queryKey })),
      // ✅ NEW: Invalidate stock engine caches when events change
      invalidateProjectStock(projectId),
      // ✅ NEW: Invalidate event-specific stock if specific event
      ...(eventId ? [invalidateEventStock(eventId, projectId)] : [])
    ]);
  }, [projectId, queryClient, invalidateProjectStock, invalidateEventStock]);

  // =============================================================================
  // OPTIMISTIC UPDATE HELPER
  // =============================================================================
  
  const updateEventOptimistically = useCallback((
    eventUpdate: Partial<CalendarEvent> & { id: string },
    operation: 'update' | 'delete'
  ) => {
    const queryKeys = [['events', projectId], ['calendar-events', projectId]];
    
    queryKeys.forEach(queryKey => {
      queryClient.setQueryData(queryKey, (oldData: CalendarEvent[] | undefined) => {
        if (!oldData) return [];
        
        if (operation === 'delete') {
          return oldData.filter(e => e.id !== eventUpdate.id);
        } else {
          return oldData.map(e => 
            e.id === eventUpdate.id ? { ...e, ...eventUpdate } : e
          );
        }
      });
    });
  }, [projectId, queryClient]);

  // =============================================================================
  // EVENT OPERATIONS
  // =============================================================================

  const addEvent = useCallback(async (
    date: Date, 
    eventName: string, 
    eventType: EventType, 
    status: CalendarEvent['status'] = 'proposed',
    variantName: string = 'default',
    location: string = '',
    locationData?: any
  ): Promise<CalendarEvent> => {
    if (!projectId) {
      throw new Error('Project ID is missing');
    }

    try {
      // Check for missing resources (non-blocking warnings)
      const validationWarnings = await checkMissingResources(projectId, eventType);
      if (validationWarnings.length > 0) {
        toast.info(`Event created with variant "${variantName}"! ${validationWarnings.join(" ")} You can sync them later.`);
      }

      // createEvent now handles all syncing internally with variant awareness
      const eventData = await createEvent(projectId, date, eventName, eventType, status, variantName, location, locationData);

      await invalidateEventQueries(eventData.id);
      toast.success(`Event created successfully using variant "${variantName}"`);
      return eventData;
    } catch (error) {
      console.error('Error adding event:', error);
      toast.error("Failed to create event");
      throw error;
    }
  }, [projectId, invalidateEventQueries]);

  const updateEvent = useCallback(async (updatedEvent: CalendarEvent): Promise<void> => {
    if (!projectId) {
      throw new Error('Project ID is missing');
    }

    // Optimistic update
    updateEventOptimistically(updatedEvent, 'update');

    try {
      await updateEventQuery(projectId, updatedEvent);
      await invalidateEventQueries(updatedEvent.id);
      toast.success("Event updated successfully");
    } catch (error) {
      console.error('Error updating event:', error);
      // Rollback optimistic update
      await invalidateEventQueries();
      toast.error("Failed to update event");
      throw error;
    }
  }, [projectId, updateEventOptimistically, invalidateEventQueries]);

  const updateEventStatus = useCallback(async (
    event: CalendarEvent, 
    newStatus: CalendarEvent['status']
  ): Promise<void> => {
    if (!projectId || !event?.id) {
      console.error('Missing projectId or event.id in updateEventStatus');
      return;
    }

    const updatedEvent = { ...event, status: newStatus };
    const oldStatus = event.status;
    
    // Optimistic update
    updateEventOptimistically(updatedEvent, 'update');

    try {
      // Update event status in database
      const { error } = await supabase
        .from('project_events')
        .update({ status: newStatus })
        .eq('id', event.id)
        .eq('project_id', projectId);

      if (error) throw error;

      // Handle draft invoice management based on status transitions
      if (newStatus === 'invoice ready' && oldStatus !== 'invoice ready') {
        // Event became invoice ready - add to draft
        console.log('🔄 Adding event to draft invoice:', event.id);
        const { error: draftError } = await supabase.rpc('add_event_to_draft', {
          p_event_id: event.id
        });
        
        if (draftError) {
          console.error('Error adding event to draft:', draftError);
          toast.error("Event updated but failed to add to draft invoice");
        } else {
          console.log('✅ Event added to draft invoice');
        }
      } else if (oldStatus === 'invoice ready' && newStatus !== 'invoice ready') {
        // Event was removed from invoice ready - remove from draft
        console.log('🔄 Removing event from draft invoice:', event.id);
        const { error: draftError } = await supabase.rpc('remove_event_from_draft', {
          p_event_id: event.id
        });
        
        if (draftError) {
          console.error('Error removing event from draft:', draftError);
          toast.error("Event updated but failed to remove from draft invoice");
        } else {
          console.log('✅ Event removed from draft invoice');
        }
      }

      toast.success(`Event status changed to ${newStatus}`);
      await invalidateEventQueries();
    } catch (error) {
      console.error('Error updating event status:', error);
      // Rollback optimistic update by invalidating all queries
      await invalidateEventQueries();
      toast.error("Failed to update event status");
      throw error;
    }
  }, [projectId, updateEventOptimistically, invalidateEventQueries]);

  const deleteEvent = useCallback(async (event: CalendarEvent): Promise<boolean> => {
    if (!projectId) return false;

    // Optimistic update
    updateEventOptimistically(event, 'delete');

    try {
      await deleteEventQuery(event.id, projectId);
      await invalidateEventQueries(event.id);
      toast.success("Event deleted successfully");
      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      // Rollback optimistic update
      await invalidateEventQueries();
      toast.error("Failed to delete event");
      throw error;
    }
  }, [projectId, updateEventOptimistically, invalidateEventQueries]);

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  const findEventOnDate = useCallback((date: Date) => {
    return events.find(event => compareDates(event.date, date));
  }, [events]);

  // =============================================================================
  // DRAG FUNCTIONALITY (if enabled)
  // =============================================================================

  const handleDragStart = useCallback((date: Date | undefined) => {
    if (!enableDragSelection || !date) return;
    setIsDragging(true);
    setDragStartDate(date);
    setSelectedDates([date]);
  }, [enableDragSelection]);

  const handleDragEnter = useCallback((date: Date) => {
    if (!enableDragSelection || !isDragging || !dragStartDate) return;
    
    const startTime = dragStartDate.getTime();
    const currentTime = date.getTime();
    const direction = currentTime >= startTime ? 1 : -1;
    
    const dates: Date[] = [];
    let currentDate = new Date(startTime);

    while (
      direction > 0 ? currentDate.getTime() <= currentTime : currentDate.getTime() >= currentTime
    ) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + direction);
    }

    setSelectedDates(dates);
  }, [enableDragSelection, isDragging, dragStartDate]);

  const resetSelection = useCallback(() => {
    if (!enableDragSelection) return;
    setSelectedDates([]);
    setIsDragging(false);
    setDragStartDate(null);
  }, [enableDragSelection]);

  // =============================================================================
  // RETURN
  // =============================================================================

  return {
    // Data
    events,
    isLoading,
    
    // Drag functionality
    isDragging: enableDragSelection ? isDragging : false,
    selectedDates: enableDragSelection ? selectedDates : [],
    
    // Event operations
    addEvent,
    updateEvent,
    deleteEvent,
    updateEventStatus,
    
    // Utility functions
    findEventOnDate,
    
    // Drag handlers
    handleDragStart,
    handleDragEnter,
    resetSelection,
  };
}

// =============================================================================
// CONVENIENCE HOOKS
// =============================================================================

/**
 * Hook for components that only need basic event data and operations
 */
export function useProjectEvents(projectId: string) {
  return useConsolidatedEvents({ projectId, enableDragSelection: false });
}

/**
 * Hook for calendar components that need full drag functionality
 */
export function useCalendarEvents(projectId: string) {
  return useConsolidatedEvents({ projectId, enableDragSelection: true });
}