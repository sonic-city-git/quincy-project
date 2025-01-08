import { Calendar } from "@/components/ui/calendar";
import { AddEventDialog } from "./AddEventDialog";
import { EditEventDialog } from "./EditEventDialog";
import { CalendarEvent, EventType } from "@/types/events";
import { DayProps } from "react-day-picker";
import { useParams } from "react-router-dom";
import { CalendarDay } from "./CalendarDay";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useToast } from "@/hooks/use-toast";
import { useEventDialog } from "@/hooks/useEventDialog";
import { useCalendarDate } from "@/hooks/useCalendarDate";

interface ProjectCalendarProps {
  className?: string;
}

export const ProjectCalendar = ({ className }: ProjectCalendarProps) => {
  const { id: projectId } = useParams<{ id: string }>();
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
        description: selectedDate ? "Project ID is missing" : "No date selected",
        variant: "destructive",
      });
      return;
    }

    try {
      await addEvent(selectedDate, eventName, eventType);
      closeAddDialog();
      toast({
        title: "Success",
        description: "Event added successfully",
      });
    } catch (error) {
      console.error('Error submitting event:', error);
      toast({
        title: "Error",
        description: "Failed to add event",
        variant: "destructive",
      });
    }
  };

  const handleEventUpdate = async (updatedEvent: CalendarEvent) => {
    try {
      await updateEvent(updatedEvent);
      closeEditDialog();
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: "Error",
        description: "Failed to update event",
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
        className={`w-full rounded-lg border-none bg-background ${className}`}
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-lg font-medium",
          nav: "space-x-1 flex items-center",
          nav_button: "h-9 w-9 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity",
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex w-full",
          head_cell: "text-muted-foreground rounded-md w-12 font-normal text-[0.8rem] h-12",
          row: "flex w-full mt-2",
          cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
          day: "h-12 w-12 p-0 font-normal",
          day_range_end: "day-range-end",
          day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside: "text-muted-foreground opacity-50",
          day_disabled: "text-muted-foreground opacity-50",
          day_hidden: "invisible",
        }}
        components={{
          Day: ({ date, ...props }: DayProps) => (
            <CalendarDay
              date={date}
              event={findEvent(date)}
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
        projectId={projectId}
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