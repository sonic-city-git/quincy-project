import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { AddEventDialog } from "./AddEventDialog";
import { EditEventDialog } from "./EditEventDialog";
import { CalendarEvent, EventType } from "@/types/events";
import { DayProps } from "react-day-picker";

const EVENT_COLORS: Record<EventType, string> = {
  "Show": "bg-green-500",
  "Preprod": "bg-yellow-500",
  "Travel": "bg-blue-500",
  "INT Storage": "bg-pink-500",
  "EXT Storage": "bg-red-500"
};

interface ProjectCalendarProps {
  className?: string;
}

export const ProjectCalendar = ({ className }: ProjectCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent>();

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
      setEvents([...events, { date: selectedDate, name: eventName, type: eventType }]);
      setIsAddDialogOpen(false);
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
          Day: ({ date: dayDate, ...props }: DayProps & { className?: string }) => {
            const event = events.find(
              (e) => e.date.toDateString() === dayDate.toDateString()
            );
            
            return (
              <button 
                {...props}
                className={`relative h-9 w-9 p-0 font-normal flex items-center justify-center text-sm cursor-pointer hover:bg-accent ${props.className || ''} ${event ? EVENT_COLORS[event.type] : ''}`}
                onClick={() => handleSelect(dayDate)}
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
      />
    </>
  );
};