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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent>();
  
  const { events, addEvent, updateEvent, findEvent } = useCalendarEvents(projectId);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const event = findEvent(date);
      
      if (event) {
        setSelectedEvent(event);
        setIsEditDialogOpen(true);
      } else {
        setSelectedDate(date);
        setIsAddDialogOpen(true);
      }
    }
  };

  const handleEventSubmit = (eventName: string, eventType: EventType) => {
    if (selectedDate) {
      addEvent(selectedDate, eventName, eventType);
      setIsAddDialogOpen(false);
    }
  };

  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    updateEvent(updatedEvent);
    setIsEditDialogOpen(false);
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