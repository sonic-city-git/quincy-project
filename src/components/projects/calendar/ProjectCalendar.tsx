import { useCalendarDate } from "@/hooks/useCalendarDate";
import { useEventDialog } from "@/hooks/useEventDialog";
import { useEventTypes } from "@/hooks/useEventTypes";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { CalendarView } from "./CalendarView";
import { Card } from "@/components/ui/card";
import { CalendarEvent } from "@/types/events";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EventManagementDialog } from "./EventManagementDialog";

interface ProjectCalendarProps {
  projectId: string;
}

export function ProjectCalendar({ projectId }: ProjectCalendarProps) {
  const { currentDate, setCurrentDate } = useCalendarDate();
  const { data: eventTypes } = useEventTypes();
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
    console.log('Calendar day clicked', { date, existingEvent });

    if (existingEvent) {
      console.log('Opening edit dialog for event:', existingEvent);
      openEditDialog(existingEvent);
    } else {
      console.log('Opening add dialog for date:', date);
      openAddDialog(date);
    }
  };

  const handleEditEvent = (event: CalendarEvent) => {
    console.log('Opening edit dialog for event:', event);
    openEditDialog(event);
  };

  const handleAddMultipleEvents = async (dates: Date[], name: string, eventType: any, status: CalendarEvent['status']) => {
    console.log('Adding multiple events:', { dates, name, eventType, status });
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
        <EventManagementDialog
          isOpen={isAddDialogOpen}
          onClose={closeAddDialog}
          event={selectedEvent}
          onUpdateEvent={updateEvent}
          onDeleteEvent={deleteEvent}
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