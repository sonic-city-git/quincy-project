
import { useCalendarDate } from "@/hooks/useCalendarDate";
import { useEventDialog } from "@/hooks/useEventDialog";
import { useEventTypes } from "@/hooks/useEventTypes";
import { useCalendarEvents } from "@/hooks/useConsolidatedEvents";
import { CalendarView } from "./CalendarView";
import { Card } from "@/components/ui/card";
import { CalendarEvent } from "@/types/events";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EventManagementDialog } from "./EventManagementDialog";
import { AddEventDialog } from "./AddEventDialog";

interface ProjectCalendarProps {
  projectId: string;
}

export function ProjectCalendar({ projectId }: ProjectCalendarProps) {
  const { currentDate, setCurrentDate } = useCalendarDate();
  const { data: eventTypes } = useEventTypes();
  // PERFORMANCE OPTIMIZATION: Use consolidated events hook with drag functionality
  const {
    events,
    isLoading,
    findEventOnDate,
    addEvent,
    updateEvent,
    deleteEvent
  } = useCalendarEvents(projectId);

  const {
    selectedDate,
    isAddDialogOpen,
    isEditDialogOpen,
    selectedEvent,
    openAddDialog,
    closeAddDialog,
    closeEditDialog,
    openEditDialog,
  } = useEventDialog();

  const handleDayClick = (date: Date) => {
    const existingEvent = findEventOnDate(date);


    if (existingEvent) {

      openEditDialog(existingEvent);
    } else {

      openAddDialog(date);
    }
  };

  const handleEditEvent = (event: CalendarEvent) => {

    openEditDialog(event);
  };

  const handleAddMultipleEvents = async (dates: Date[], name: string, eventType: any, status: CalendarEvent['status']) => {

    for (const date of dates) {
      await addEvent(date, name, eventType, status);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full p-6">
        <div className="h-[400px] flex items-center justify-center text-muted-foreground">
          Loading calendar...
        </div>
      </Card>
    );
  }

  if (!eventTypes) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="w-full space-y-8">
        <CalendarView
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          events={events || []}
          onDayClick={handleDayClick}
          eventTypes={eventTypes}
          onAddMultipleEvents={handleAddMultipleEvents}
          onEditEvent={handleEditEvent}
        />

        {/* Add Dialog */}
        <AddEventDialog
          isOpen={isAddDialogOpen}
          onClose={closeAddDialog}
          selectedDate={selectedDate}
          onAddEvent={addEvent}
        />

        {/* Edit Dialog */}
        <EventManagementDialog
          isOpen={isEditDialogOpen}
          onClose={closeEditDialog}
          event={selectedEvent}
          onUpdateEvent={updateEvent}
          onDeleteEvent={deleteEvent}
        />
      </div>
    </TooltipProvider>
  );
}
