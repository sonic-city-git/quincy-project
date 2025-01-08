import { Calendar } from "@/components/ui/calendar";
import { AddEventDialog } from "./AddEventDialog";
import { EditEventDialog } from "./EditEventDialog";
import { CalendarEvent, EventType } from "@/types/events";
import { DayProps } from "react-day-picker";
import { useParams } from "react-router-dom";
import { CalendarDay } from "./CalendarDay";
import { EVENT_COLORS } from "@/constants/eventColors";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useToast } from "@/hooks/use-toast";
import { useEventDialog } from "@/hooks/useEventDialog";
import { useCalendarDate } from "@/hooks/useCalendarDate";

interface ProjectCalendarProps {
  className?: string;
}

export const ProjectCalendar = ({ className }: ProjectCalendarProps) => {
  const { projectId } = useParams();
  const { toast } = useToast();
  const { events, addEvent, updateEvent, findEvent } = useCalendarEvents(projectId);
  const { normalizeDate } = useCalendarDate();
  const {
    selectedDate,
    isAddDialogOpen,
    isEditDialogOpen,
    selectedEvent,
    openAddDialog,
    openEditDialog,
    closeAddDialog,
    closeEditDialog,
  } = useEventDialog();

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const normalizedDate = normalizeDate(date);
    const event = findEvent(normalizedDate);
    
    if (event) {
      openEditDialog(event);
    } else {
      openAddDialog(normalizedDate);
    }
  };

  const handleEventSubmit = async (eventName: string, eventType: EventType) => {
    if (!selectedDate || !projectId) {
      toast({
        title: "Error",
        description: "Missing required data to add event",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log('Submitting event:', { eventName, eventType, selectedDate });
      await addEvent(selectedDate, eventName, eventType);
      closeAddDialog();
    } catch (error) {
      console.error('Error submitting event:', error);
      toast({
        title: "Error",
        description: "Failed to add event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEventUpdate = async (updatedEvent: CalendarEvent) => {
    try {
      await updateEvent(updatedEvent);
      closeEditDialog();
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: "Error",
        description: "Failed to update event. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={handleSelect}
        className={`w-full rounded-md border ${className}`}
        modifiers={{ today: undefined }}
        modifiersClassNames={{
          selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        }}
        modifiersStyles={{
          today: {
            fontWeight: 'normal',
            border: 'none'
          }
        }}
        components={{
          Day: ({ date, ...props }: DayProps) => (
            <CalendarDay
              date={date}
              event={findEvent(date)}
              eventColors={EVENT_COLORS}
              onSelect={handleSelect}
              {...props}
            />
          ),
        }}
      />
      <AddEventDialog
        isOpen={isAddDialogOpen}
        onOpenChange={closeAddDialog}
        onSubmit={handleEventSubmit}
        date={selectedDate}
      />
      <EditEventDialog
        isOpen={isEditDialogOpen}
        onOpenChange={closeEditDialog}
        event={selectedEvent}
        onSave={handleEventUpdate}
      />
    </>
  );
};