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
  const lastSelectedDate = useRef(selectedDate);
  const animationRef = useRef<number | null>(null); // Track animation frame

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

  // Custom smooth scroll animation with proper cancellation
  const scrollToDate = useCallback((targetDate: Date, animate = true) => {
    if (!equipmentRowsRef.current) return;
    
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
      const containerWidth = equipmentRowsRef.current.clientWidth;
      const targetPosition = targetIndex * dayWidth;
      const centerOffset = containerWidth / 2 - dayWidth / 2;
      const targetScrollLeft = Math.max(0, targetPosition - centerOffset);
      
      if (animate) {
        console.log(`Starting animation to ${targetDateStr} (${targetScrollLeft}px)`);
        
        // Custom smooth scroll with easing
        const startScrollLeft = equipmentRowsRef.current.scrollLeft;
        const distance = targetScrollLeft - startScrollLeft;
        const duration = 900; // 900ms animation
        const startTime = performance.now();
        
        console.log(`Animation: start=${startScrollLeft}, target=${targetScrollLeft}, distance=${distance}`);
        
        const animateScroll = (currentTime: number) => {
          if (!equipmentRowsRef.current) {
            console.log('Animation stopped - no ref');
            return;
          }
          
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Ease out cubic for smooth deceleration
          const easeOutCubic = 1 - Math.pow(1 - progress, 3);
          
          const currentScrollLeft = startScrollLeft + (distance * easeOutCubic);
          equipmentRowsRef.current.scrollLeft = currentScrollLeft;
          
          if (progress < 1) {
            animationRef.current = requestAnimationFrame(animateScroll);
          } else {
            console.log(`Animation completed in ${elapsed}ms`);
            animationRef.current = null;
          }
        };
        
        animationRef.current = requestAnimationFrame(animateScroll);
      } else {
        // Instant scroll (for page load)
        equipmentRowsRef.current.scrollLeft = targetScrollLeft;
      }
    } else {
      console.log(`Date ${targetDateStr} not found in timeline`);
    }
  }, [timelineDates]);
  
  // Handle selectedDate changes (for timeline range updates only)
  useEffect(() => {
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    const lastSelectedDateStr = format(lastSelectedDate.current, 'yyyy-MM-dd');
    
    // Only update timeline range if selectedDate actually changed
    if (selectedDateStr !== lastSelectedDateStr) {
      // Check if selected date is already in current timeline range
      const isInCurrentRange = selectedDate >= timelineStart && selectedDate <= timelineEnd;
      
      if (!isInCurrentRange) {
        console.log(`Timeline range updating for ${selectedDateStr} (outside current range)`);
        
        const newTimelineStart = addDays(selectedDate, -35);
        const newTimelineEnd = addDays(selectedDate, 35);
        
        setTimelineStart(newTimelineStart);
        setTimelineEnd(newTimelineEnd);
      } else {
        console.log(`Date ${selectedDateStr} already in range - no timeline update needed`);
      }
      
      // Update our tracking ref
      lastSelectedDate.current = selectedDate;
    }
  }, [selectedDate, timelineStart, timelineEnd]);

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
    equipmentRowsRef, // Only master scroll area
    loadMoreDates,
    scrollToDate,
  };
}