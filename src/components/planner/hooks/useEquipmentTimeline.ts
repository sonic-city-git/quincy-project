import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { addDays, format } from 'date-fns';

interface UseEquipmentTimelineProps {
  selectedDate: Date;
}

export function useEquipmentTimeline({ selectedDate }: UseEquipmentTimelineProps) {
  // Day-based infinite scrolling: Larger buffer to reduce fetch frequency
  const [timelineStart, setTimelineStart] = useState(() => addDays(selectedDate, -35));
  const [timelineEnd, setTimelineEnd] = useState(() => addDays(selectedDate, 35));
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 });
  
  const equipmentRowsRef = useRef<HTMLDivElement>(null); // Master scroll area
  const loadingRef = useRef(false);
  const hasInitializedScroll = useRef(false);

  // Generate timeline dates - memoized for performance
  const timelineDates = useMemo(() => {
    const dates = [];
    let currentDate = new Date(timelineStart);
    while (currentDate <= timelineEnd) {
      dates.push(new Date(currentDate));
      currentDate = addDays(currentDate, 1);
    }
    return dates;
  }, [timelineStart, timelineEnd]);

  // Seamless day-by-day loading: Add small chunks frequently
  const loadMoreDates = useCallback((direction: 'start' | 'end') => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    if (direction === 'start') {
      setTimelineStart(prev => addDays(prev, -14)); // Add 2 weeks before
    } else {
      setTimelineEnd(prev => addDays(prev, 14)); // Add 2 weeks after
    }
    
    setTimeout(() => {
      loadingRef.current = false;
    }, 100); // Reasonable loading reset to prevent excessive triggers
  }, []);

  // Center today's date in master scroll area
  useEffect(() => {
    if (!equipmentRowsRef.current || hasInitializedScroll.current) return;
    
    // Use requestAnimationFrame for smooth initialization
    requestAnimationFrame(() => {
      if (!equipmentRowsRef.current) return;
      
      const today = new Date();
      const todayDateStr = format(today, 'yyyy-MM-dd');
      
      const todayIndex = timelineDates.findIndex(date => 
        format(date, 'yyyy-MM-dd') === todayDateStr
      );
      
      if (todayIndex !== -1) {
        const dayWidth = 50;
        const containerWidth = equipmentRowsRef.current.clientWidth;
        const todayPosition = todayIndex * dayWidth;
        const centerOffset = containerWidth / 2 - dayWidth / 2;
        const scrollLeft = Math.max(0, todayPosition - centerOffset);
        
        // Set scroll position for master scroll area only
        equipmentRowsRef.current.scrollLeft = scrollLeft;
        
        hasInitializedScroll.current = true;
      }
    });
  }, [timelineDates, timelineStart, timelineEnd]);

  // Reset on date change
  useEffect(() => {
    hasInitializedScroll.current = false;
  }, [selectedDate]);

  return {
    timelineStart,
    timelineEnd,
    timelineDates,
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
    equipmentRowsRef, // Only master scroll area
    loadMoreDates,
  };
}