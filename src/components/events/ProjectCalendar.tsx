import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { AddEventDialog } from "./AddEventDialog";
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
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      setIsDialogOpen(true);
    }
  };

  const handleEventSubmit = (eventName: string, eventType: EventType) => {
    if (date) {
      setEvents([...events, { date, name: eventName, type: eventType }]);
      setIsDialogOpen(false);
    }
  };

  return (
    <>
      <Calendar
        mode="single"
        selected={date}
        onSelect={handleDateSelect}
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
              <div 
                {...props}
                className={`relative h-9 w-9 p-0 font-normal flex items-center justify-center text-sm ${props.className || ''} ${event ? EVENT_COLORS[event.type] : ''}`}
              >
                {dayDate.getDate()}
              </div>
            );
          },
        }}
      />
      <AddEventDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleEventSubmit}
        date={date}
      />
    </>
  );
};