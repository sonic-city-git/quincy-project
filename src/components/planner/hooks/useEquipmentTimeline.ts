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
  const lastSelectedDate = useRef(selectedDate);

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

  // Rate-limited timeline expansion to prevent excessive API calls
  const lastLoadTime = useRef(0);
  const LOAD_COOLDOWN = 300; // Reduced to 300ms for better prefetching responsiveness
  
  // Track year boundaries for optimized expansion
  const getYearBoundaryInfo = useCallback((start: Date, end: Date) => {
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    const crossesYears = startYear !== endYear;
    const yearSpan = endYear - startYear + 1;
    
    return { startYear, endYear, crossesYears, yearSpan };
  }, []);
  
  // Use refs to get current timeline values to avoid stale closures
  const timelineStartRef = useRef(timelineStart);
  const timelineEndRef = useRef(timelineEnd);
  
  // Keep refs updated
  useEffect(() => {
    timelineStartRef.current = timelineStart;
    timelineEndRef.current = timelineEnd;
  }, [timelineStart, timelineEnd]);

  const loadMoreDates = useCallback((direction: 'start' | 'end') => {
    const now = Date.now();
    
    // Prevent rapid consecutive loads
    if (loadingRef.current || (now - lastLoadTime.current) < LOAD_COOLDOWN) {
      return;
    }
    
    loadingRef.current = true;
    lastLoadTime.current = now;

    // Use refs to get current values instead of stale closure values
    const currentStart = timelineStartRef.current;
    const currentEnd = timelineEndRef.current;

    // Direct state updates - larger buffer for better prefetching
    if (direction === 'start') {
      const newStart = addDays(currentStart, -35); // Add 5 weeks (more buffer for smoother scrolling)
      const yearInfo = getYearBoundaryInfo(newStart, currentEnd);
      
      // Log year boundary crossing for debugging
      if (yearInfo.crossesYears) {
        console.log(`Timeline expansion crosses years: ${yearInfo.startYear}-${yearInfo.endYear} (start expansion)`);
      }
      
      setTimelineStart(newStart);
    } else {
      const newEnd = addDays(currentEnd, 35); // Add 5 weeks (more buffer for smoother scrolling)
      const yearInfo = getYearBoundaryInfo(currentStart, newEnd);
      
      // Log year boundary crossing for debugging
      if (yearInfo.crossesYears) {
        console.log(`Timeline expansion crosses years: ${yearInfo.startYear}-${yearInfo.endYear} (end expansion)`);
      }
      
      setTimelineEnd(newEnd);
    }
    
    setTimeout(() => {
      loadingRef.current = false;
    }, 200); // Reduced timeout
  }, [getYearBoundaryInfo]); // Removed stale dependencies

  // Handle external selectedDate changes (not from infinite scroll)
  useEffect(() => {
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    const lastSelectedDateStr = format(lastSelectedDate.current, 'yyyy-MM-dd');
    
    // Only update timeline if selectedDate actually changed externally
    if (selectedDateStr !== lastSelectedDateStr) {
      const newTimelineStart = addDays(selectedDate, -35);
      const newTimelineEnd = addDays(selectedDate, 35);
      
      setTimelineStart(newTimelineStart);
      setTimelineEnd(newTimelineEnd);
      
      // Reset scroll initialization so the new date gets centered
      hasInitializedScroll.current = false;
      
      // Update our tracking ref
      lastSelectedDate.current = selectedDate;
    }
  }, [selectedDate]);

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

  // Note: Scroll reset is now handled in the selectedDate change effect above

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