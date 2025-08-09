/**
 * 📅 EVENT DOMAIN HOOKS
 * 
 * All hooks related to events and event management.
 * Sync operations eliminated in favor of hybrid event ownership model.
 */

export { useConsolidatedEvents, useProjectEvents, useCalendarEvents } from './useConsolidatedEvents';
export { useEventDeletion } from './useEventDeletion';
export { useEventDialog } from './useEventDialog';
export { useEventTypes } from './useEventTypes';
