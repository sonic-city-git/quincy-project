import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { addDays, format } from 'date-fns';

interface UseCrewTimelineProps {
  selectedDate: Date;
}

export function useCrewTimeline({ selectedDate }: UseCrewTimelineProps) {
  // Day-based infinite scrolling: Larger buffer to reduce fetch frequency
  const [timelineStart, setTimelineStart] = useState(() => addDays(selectedDate, -35));
  const [timelineEnd, setTimelineEnd] = useState(() => addDays(selectedDate, 35));
  
  // Drag and scroll state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 });
  
  // Refs for timeline elements  
  const crewRowsRef = useRef<HTMLDivElement>(null);
  
  // Generate timeline dates efficiently
  const timelineDates = useMemo(() => {
    const dates: Date[] = [];
    const current = new Date(timelineStart);
    const end = new Date(timelineEnd);
    
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }, [timelineStart, timelineEnd]);

  // Load more dates for infinite scroll
  const loadMoreDates = useCallback((direction: 'start' | 'end') => {
    const daysToAdd = 35; // Add 5 weeks at a time
    
    if (direction === 'start') {
      setTimelineStart(prev => addDays(prev, -daysToAdd));
    } else {
      setTimelineEnd(prev => addDays(prev, daysToAdd));
    }
  }, []);

  // Smooth scroll to specific date
  const scrollToDate = useCallback((targetDate: Date, animate: boolean = true) => {
    if (!crewRowsRef.current) return;

    const targetDateStr = format(targetDate, 'yyyy-MM-dd');
    const targetIndex = timelineDates.findIndex(date => 
      format(date, 'yyyy-MM-dd') === targetDateStr
    );
    
    if (targetIndex === -1) return;

    const dayWidth = 50; // LAYOUT.DAY_CELL_WIDTH
    const scrollLeft = targetIndex * dayWidth;
    
    if (animate) {
      crewRowsRef.current.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
    } else {
      crewRowsRef.current.scrollLeft = scrollLeft;
    }
  }, [timelineDates]);

  // Auto-scroll to selected date when timeline range changes
  useEffect(() => {
    // Small delay to ensure DOM is updated
    const timer = setTimeout(() => {
      scrollToDate(selectedDate, false);
    }, 50);
    
    return () => clearTimeout(timer);
  }, [timelineStart, timelineEnd, scrollToDate, selectedDate]);

  return {
    timelineStart,
    timelineEnd,
    timelineDates,
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
    equipmentRowsRef: crewRowsRef, // Rename for compatibility with shared components
    loadMoreDates,
    scrollToDate,
  };
}