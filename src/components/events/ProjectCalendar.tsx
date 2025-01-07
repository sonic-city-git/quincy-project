import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { AddEventDialog } from "./AddEventDialog";
import { CalendarEvent, EventType } from "@/types/events";

const EVENT_COLORS: Record<EventType, string> = {
  "Show": "bg-green-100 hover:bg-green-200",
  "Preprod": "bg-yellow-100 hover:bg-yellow-200",
  "Travel": "bg-blue-100 hover:bg-blue-200",
  "INT Storage": "bg-pink-100 hover:bg-pink-200",
  "EXT Storage": "bg-red-100 hover:bg-red-200"
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

  const getDateClassNames = (date: Date) => {
    const event = events.find(
      (e) => e.date.toDateString() === date.toDateString()
    );
    return event ? EVENT_COLORS[event.type] : undefined;
  };

  return (
    <>
      <Calendar
        mode="single"
        selected={date}
        onSelect={handleDateSelect}
        className={className}
        modifiersClassNames={{
          selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        }}
        modifierStyles={{}}
        styles={{
          day_today: { fontWeight: 'bold' }
        }}
        components={{
          Day: ({ date: dayDate, ...props }) => {
            const customClassName = getDateClassNames(dayDate);
            return (
              <button
                {...props}
                className={`${props.className} ${customClassName || ''}`}
              />
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