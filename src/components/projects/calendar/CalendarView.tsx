import { Calendar } from "@/components/ui/calendar/Calendar";
import { CalendarEvent, EventType } from "@/types/events";
import { useState } from "react";

interface CalendarViewProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  events: CalendarEvent[];
  onDayClick: (date: Date, callback?: (date: Date, name: string, eventType: EventType) => void) => void;
}

// Event types that can be used for drag-select
const DRAGGABLE_EVENT_TYPES = ['Preprod', 'INT Storage', 'EXT Storage', 'Hours'];

export function CalendarView({
  currentDate,
  setCurrentDate,
  events,
  onDayClick
}: CalendarViewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  const handleDayClick = (date: Date) => {
    // Find if there's an event on this date by comparing just the date parts
    const eventOnDate = events.find(event => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === date.getDate() && 
             eventDate.getMonth() === date.getMonth() && 
             eventDate.getFullYear() === date.getFullYear();
    });

    console.log('Calendar day clicked', { date, existingEvent: eventOnDate });
    
    if (eventOnDate) {
      console.log('Found event, opening edit dialog for event:', eventOnDate);
      onDayClick(new Date(eventOnDate.date));
    } else {
      console.log('No event found, opening add dialog');
      onDayClick(date);
    }
  };

  const handleDragStart = (date: Date) => {
    // Check if there's an event on this date
    const hasEvent = events.some(event => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === date.getDate() && 
             eventDate.getMonth() === date.getMonth() && 
             eventDate.getFullYear() === date.getFullYear();
    });

    if (!hasEvent) {
      setIsDragging(true);
      setSelectedDates([date]);
    }
  };

  const handleDragEnter = (date: Date) => {
    if (!isDragging) return;

    const startDate = selectedDates[0];
    const dates: Date[] = [];
    
    // Calculate the range of dates
    const start = new Date(Math.min(startDate.getTime(), date.getTime()));
    const end = new Date(Math.max(startDate.getTime(), date.getTime()));
    
    let current = new Date(start);
    while (current <= end) {
      // Only add dates that don't have existing events
      const hasEvent = events.some(event => {
        const eventDate = new Date(event.date);
        return eventDate.getDate() === current.getDate() && 
               eventDate.getMonth() === current.getMonth() && 
               eventDate.getFullYear() === current.getFullYear();
      });
      
      if (!hasEvent) {
        dates.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }
    
    setSelectedDates(dates);
  };

  const handleDragEnd = () => {
    if (selectedDates.length > 0) {
      // Sort dates to ensure chronological order
      const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
      // Open add dialog with the first selected date and a callback to create events for all dates
      onDayClick(sortedDates[0], (date: Date, name: string, eventType: EventType) => {
        // Only proceed if the event type is allowed for drag-select
        if (DRAGGABLE_EVENT_TYPES.includes(eventType.name)) {
          // Create events for all selected dates
          return Promise.all(sortedDates.map(selectedDate => {
            // Create a new event for each date
            return onDayClick(selectedDate, undefined);
          }));
        } else {
          console.log('Event type not allowed for drag-select:', eventType.name);
          return Promise.resolve();
        }
      });
    }
    setIsDragging(false);
    setSelectedDates([]);
  };

  return (
    <Calendar
      mode="single"
      month={currentDate}
      onMonthChange={setCurrentDate}
      events={events}
      onDayClick={handleDayClick}
      selectedDates={selectedDates}
      onDragStart={handleDragStart}
      onDragEnter={handleDragEnter}
      onDragEnd={handleDragEnd}
      className="w-full rounded-md border border-zinc-800 bg-zinc-950"
    />
  );
}