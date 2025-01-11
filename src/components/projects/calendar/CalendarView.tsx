import { Calendar } from "@/components/ui/calendar/Calendar";
import { CalendarEvent, EventType } from "@/types/events";
import { useState } from "react";
import { MultiEventDialog } from "./MultiEventDialog";

interface CalendarViewProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  events: CalendarEvent[];
  onDayClick: (date: Date) => void;
  eventTypes?: EventType[];
  onAddMultipleEvents: (dates: Date[], name: string, eventType: EventType) => void;
}

export function CalendarView({
  currentDate,
  setCurrentDate,
  events,
  onDayClick,
  eventTypes = [],
  onAddMultipleEvents
}: CalendarViewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartTime, setDragStartTime] = useState<number | null>(null);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isMultiEventDialogOpen, setIsMultiEventDialogOpen] = useState(false);

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
      setDragStartTime(Date.now());
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
    // Only show multi-event dialog if we're actually dragging (more than 200ms)
    const isDragOperation = dragStartTime && (Date.now() - dragStartTime) > 200;
    
    if (isDragOperation && selectedDates.length > 0) {
      setIsMultiEventDialogOpen(true);
    } else {
      // If it's a quick click, treat it as a regular day click
      if (selectedDates.length === 1) {
        handleDayClick(selectedDates[0]);
      }
    }
    
    setIsDragging(false);
    setDragStartTime(null);
    
    // Only clear selected dates if we're not opening the multi-event dialog
    if (!isDragOperation) {
      setSelectedDates([]);
    }
  };

  const handleAddMultipleEvents = (name: string, eventType: EventType) => {
    onAddMultipleEvents(selectedDates, name, eventType);
    setSelectedDates([]);
    setIsMultiEventDialogOpen(false);
  };

  return (
    <>
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

      <MultiEventDialog
        isOpen={isMultiEventDialogOpen}
        onClose={() => {
          setIsMultiEventDialogOpen(false);
          setSelectedDates([]);
        }}
        dates={selectedDates}
        eventTypes={eventTypes || []}
        onAddEvents={handleAddMultipleEvents}
      />
    </>
  );
}