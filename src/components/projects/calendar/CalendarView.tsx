import { Calendar } from "@/components/ui/calendar/Calendar";
import { CalendarEvent } from "@/types/events";
import { normalizeDate } from "@/utils/calendarUtils";
import { useState } from "react";

interface CalendarViewProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  events: CalendarEvent[];
  onDayClick: (date: Date) => void;
}

export function CalendarView({
  currentDate,
  setCurrentDate,
  events,
  onDayClick
}: CalendarViewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  const handleDayClick = (date: Date) => {
    const normalizedDate = normalizeDate(date);
    if (!normalizedDate) return;
    
    // Find if there's an event on this date
    const eventOnDate = events.find(event => {
      const eventDate = new Date(event.date);
      return normalizeDate(eventDate).getTime() === normalizedDate.getTime();
    });

    console.log('Calendar day clicked', { date: normalizedDate, existingEvent: eventOnDate });
    
    if (eventOnDate) {
      console.log('Found event, opening edit dialog for event:', eventOnDate);
      onDayClick(new Date(eventOnDate.date));
    } else {
      console.log('No event found, opening add dialog');
      onDayClick(normalizedDate);
    }
  };

  const handleDragStart = (date: Date) => {
    setIsDragging(true);
    setSelectedDates([date]);
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
      const hasEvent = events.some(event => 
        normalizeDate(new Date(event.date)).getTime() === normalizeDate(current).getTime()
      );
      
      if (!hasEvent) {
        dates.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }
    
    setSelectedDates(dates);
  };

  const handleDragEnd = () => {
    if (selectedDates.length > 0) {
      // Open add dialog with the first selected date
      onDayClick(selectedDates[0]);
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