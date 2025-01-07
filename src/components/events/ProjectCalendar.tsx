import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { AddEventDialog } from "./AddEventDialog";
import { EditEventDialog } from "./EditEventDialog";
import { CalendarEvent, EventType } from "@/types/events";
import { DayProps } from "react-day-picker";
import { useParams } from "react-router-dom";

const EVENT_COLORS: Record<EventType, string> = {
  "Show": "bg-green-500/80 hover:bg-green-600/80",
  "Preprod": "bg-amber-500/80 hover:bg-amber-600/80",
  "Travel": "bg-blue-500/80 hover:bg-blue-600/80",
  "INT Storage": "bg-purple-500/80 hover:bg-purple-600/80",
  "EXT Storage": "bg-red-500/80 hover:bg-red-600/80"
};

interface ProjectCalendarProps {
  className?: string;
}

export const ProjectCalendar = ({ className }: ProjectCalendarProps) => {
  const { projectId } = useParams();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent>();

  useEffect(() => {
    const storedEvents = localStorage.getItem(`calendar-events-${projectId}`);
    if (storedEvents) {
      const parsedEvents = JSON.parse(storedEvents).map((event: any) => ({
        ...event,
        date: new Date(event.date)
      }));
      setEvents(parsedEvents);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      localStorage.setItem(`calendar-events-${projectId}`, JSON.stringify(events));
    }
  }, [events, projectId]);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const event = events.find(
        (e) => e.date.toDateString() === date.toDateString()
      );
      
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
      setEvents([...events, { 
        date: selectedDate, 
        name: eventName.trim() || eventType, 
        type: eventType 
      }]);
      setIsAddDialogOpen(false);
    }
  };

  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    const updatedEvents = events.map(event => 
      event.date.toDateString() === updatedEvent.date.toDateString() 
        ? { ...updatedEvent, name: updatedEvent.name.trim() || updatedEvent.type }
        : event
    );
    setEvents(updatedEvents);
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
          Day: ({ date: dayDate, ...props }: DayProps & { className?: string }) => {
            const event = events.find(
              (e) => e.date.toDateString() === dayDate.toDateString()
            );
            
            return (
              <button 
                {...props}
                className={`
                  relative h-9 w-9 p-0 font-normal 
                  flex items-center justify-center text-sm 
                  cursor-pointer hover:bg-accent 
                  transition-colors duration-200
                  rounded-md shadow-sm
                  ${props.className || ''} 
                  ${event ? `${EVENT_COLORS[event.type]} text-white font-medium` : ''}
                `}
                onClick={() => handleSelect(dayDate)}
                title={event?.name}
              >
                {dayDate.getDate()}
              </button>
            );
          },
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