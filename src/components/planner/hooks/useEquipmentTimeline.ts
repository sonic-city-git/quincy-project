import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { addDays, format } from 'date-fns';

interface UseEquipmentTimelineProps {
  selectedDate: Date;
}

export function useEquipmentTimeline({ selectedDate }: UseEquipmentTimelineProps) {
  // Smart rendering: Start with just 2 months total (1 before + 1 after)
  const [timelineStart, setTimelineStart] = useState(() => addDays(selectedDate, -30));
  const [timelineEnd, setTimelineEnd] = useState(() => addDays(selectedDate, 30));
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 });
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const equipmentRowsRef = useRef<HTMLDivElement>(null);
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

  // Smart loading: Add 1 month at a time when needed
  const loadMoreDates = useCallback((direction: 'start' | 'end') => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    if (direction === 'start') {
      setTimelineStart(prev => addDays(prev, -30)); // Add 1 month before
    } else {
      setTimelineEnd(prev => addDays(prev, 30)); // Add 1 month after
    }
    
    setTimeout(() => {
      loadingRef.current = false;
    }, 100);
  }, []);

  // Center today's date
  useEffect(() => {
    if (!timelineRef.current || !equipmentRowsRef.current || hasInitializedScroll.current) return;
    
    // Use requestAnimationFrame for smooth initialization
    requestAnimationFrame(() => {
      if (!timelineRef.current || !equipmentRowsRef.current) return;
      
      const today = new Date();
      const todayDateStr = format(today, 'yyyy-MM-dd');
      
      const todayIndex = timelineDates.findIndex(date => 
        format(date, 'yyyy-MM-dd') === todayDateStr
      );
      
      if (todayIndex !== -1) {
        const dayWidth = 50;
        const containerWidth = timelineRef.current.clientWidth;
        const todayPosition = todayIndex * dayWidth;
        const centerOffset = containerWidth / 2 - dayWidth / 2;
        const scrollLeft = Math.max(0, todayPosition - centerOffset);
        
        // Set scroll position for timeline header
        timelineRef.current.scrollLeft = scrollLeft;
        
        // Set scroll position for master equipment scroll area
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
    timelineRef,
    equipmentRowsRef,
    loadMoreDates,
  };
}