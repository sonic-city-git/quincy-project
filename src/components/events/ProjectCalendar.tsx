import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { AddEventDialog } from "./AddEventDialog";
import { EditEventDialog } from "./EditEventDialog";
import { CalendarEvent, EventType } from "@/types/events";
import { DayProps } from "react-day-picker";
import { useParams } from "react-router-dom";
import { CalendarDay } from "./CalendarDay";
import { EVENT_COLORS } from "@/constants/eventColors";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";

interface ProjectCalendarProps {
  className?: string;
}

export const ProjectCalendar = ({ className }: ProjectCalendarProps) => {
  const { projectId } = useParams();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent>();
  
  const { events, addEvent, updateEvent, findEvent } = useCalendarEvents(projectId);

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    
    // Create a new date at midnight UTC
    const normalizedDate = new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    ));
    
    const event = findEvent(normalizedDate);
    if (event) {
      setSelectedEvent(event);
      setIsEditDialogOpen(true);
    } else {
      setSelectedDate(normalizedDate);
      setIsAddDialogOpen(true);
    }
  };

  const handleEventSubmit = async (eventName: string, eventType: EventType) => {
    if (!selectedDate || !projectId) return;
    
    console.log('Submitting event:', { eventName, eventType, selectedDate });
    await addEvent(selectedDate, eventName, eventType);
    setIsAddDialogOpen(false);
    setSelectedDate(undefined);
  };

  const handleEventUpdate = async (updatedEvent: CalendarEvent) => {
    await updateEvent(updatedEvent);
    setIsEditDialogOpen(false);
    setSelectedEvent(undefined);
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
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleEventSubmit}
        date={selectedDate}
      />
      <EditEventDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        event={selectedEvent}
        onSave={handleEventUpdate}
      />
    </>
  );
};