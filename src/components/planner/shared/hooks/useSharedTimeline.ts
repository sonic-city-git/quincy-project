import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { addDays, format } from 'date-fns';

interface UseSharedTimelineProps {
  selectedDate: Date;
}

export function useSharedTimeline({ selectedDate }: UseSharedTimelineProps) {
  // Day-based infinite scrolling: Larger buffer to reduce fetch frequency
  const [timelineStart, setTimelineStart] = useState(() => addDays(selectedDate, -35));
  const [timelineEnd, setTimelineEnd] = useState(() => addDays(selectedDate, 35));
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 });
  
  // Shared scroll container ref for both Equipment and Crew planners
  const timelineRowsRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const lastSelectedDate = useRef(selectedDate);
  const animationRef = useRef<number | null>(null);
  
  // Track if we've done initial scroll to today
  const hasInitialScrolled = useRef(false);

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
  const LOAD_COOLDOWN = 300;
  
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
      const newStart = addDays(currentStart, -35);
      setTimelineStart(newStart);
    } else {
      const newEnd = addDays(currentEnd, 35);
      setTimelineEnd(newEnd);
    }
    
    setTimeout(() => {
      loadingRef.current = false;
    }, 200);
  }, []);

  // Custom smooth scroll animation with proper cancellation
  const scrollToDate = useCallback((targetDate: Date, animate = true) => {
    if (!timelineRowsRef.current) return;
    
    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    const targetDateStr = format(targetDate, 'yyyy-MM-dd');
    const targetIndex = timelineDates.findIndex(date => 
      format(date, 'yyyy-MM-dd') === targetDateStr
    );
    
    if (targetIndex !== -1) {
      const dayWidth = 50;
      const containerWidth = timelineRowsRef.current.clientWidth;
      const targetPosition = targetIndex * dayWidth;
      const centerOffset = containerWidth / 2 - dayWidth / 2;
      const targetScrollLeft = Math.max(0, targetPosition - centerOffset);
      
      if (animate) {
        const startScrollLeft = timelineRowsRef.current.scrollLeft;
        const distance = targetScrollLeft - startScrollLeft;
        
        // Custom smooth scroll with easing
        const duration = 900;
        const startTime = performance.now();
        
        const animateScroll = (currentTime: number) => {
          if (!timelineRowsRef.current) {
            return;
          }
          
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Ease out cubic for smooth deceleration
          const easeOutCubic = 1 - Math.pow(1 - progress, 3);
          
          const currentScrollLeft = startScrollLeft + (distance * easeOutCubic);
          timelineRowsRef.current.scrollLeft = currentScrollLeft;
          
          if (progress < 1) {
            animationRef.current = requestAnimationFrame(animateScroll);
          } else {
            animationRef.current = null;
          }
        };
        
        animationRef.current = requestAnimationFrame(animateScroll);
      } else {
        // Instant scroll (for page load)
        timelineRowsRef.current.scrollLeft = targetScrollLeft;
      }
    }
  }, [timelineDates]);
  
  // Simple scroll logic:
  // 1. On browser refresh → scroll to today (no animation)
  // 2. When selectedDate changes → scroll to that date (with animation)
  
  // Initial scroll to today on browser refresh
  useEffect(() => {
    if (!hasInitialScrolled.current) {
      hasInitialScrolled.current = true;
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const today = new Date();
        scrollToDate(today, false); // false = no animation on initial load
      }, 300);
    }
  }, []); // Only on first mount
  
  // Scroll to selected date when it changes
  useEffect(() => {
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    const lastSelectedDateStr = format(lastSelectedDate.current, 'yyyy-MM-dd');
    
    // Only process if selectedDate actually changed
    if (selectedDateStr !== lastSelectedDateStr) {
      // Check if selected date is already in current timeline range
      const isInCurrentRange = selectedDate >= timelineStart && selectedDate <= timelineEnd;
      
      if (!isInCurrentRange) {
        // Expand timeline range to include selected date
        const newTimelineStart = addDays(selectedDate, -35);
        const newTimelineEnd = addDays(selectedDate, 35);
        
        setTimelineStart(newTimelineStart);
        setTimelineEnd(newTimelineEnd);
      }
      
      // Always scroll to selected date (animate if after initial load)
      if (hasInitialScrolled.current) {
        scrollToDate(selectedDate, true); // true = animate for user selections
      }
      
      // Update tracking ref
      lastSelectedDate.current = selectedDate;
    }
  }, [selectedDate, timelineStart, timelineEnd, scrollToDate]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return {
    timelineStart,
    timelineEnd,
    timelineDates,
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
    equipmentRowsRef: timelineRowsRef, // Use shared ref for both planners
    loadMoreDates,
    scrollToDate,
  };
}