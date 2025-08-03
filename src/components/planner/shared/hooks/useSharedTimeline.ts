import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { addDays, format, isWeekend } from 'date-fns';
import { LAYOUT } from '../constants';

interface UseSharedTimelineProps {
  selectedDate: Date;
}

export function useSharedTimeline({ selectedDate }: UseSharedTimelineProps) {
  // OPTIMIZED: Start with 40 days total (-20/+20) for fastest initial load
  const [timelineStart, setTimelineStart] = useState(() => {
    const today = new Date();
    return addDays(today, -20);
  });
  const [timelineEnd, setTimelineEnd] = useState(() => {
    const today = new Date();
    return addDays(today, 20);
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 });
  
  // Shared scroll container ref for both Equipment and Crew planners
  const timelineRowsRef = useRef<HTMLDivElement>(null);
  const stickyHeadersRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const lastSelectedDate = useRef(selectedDate);
  const animationRef = useRef<number | null>(null);
  
  // Track initial scroll to center today once
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

    // FIXED: Preserve scroll position when expanding timeline
    let currentScrollLeft = 0;
    if (timelineRowsRef.current) {
      currentScrollLeft = timelineRowsRef.current.scrollLeft;
    }

    // Use refs to get current values instead of stale closure values
    const currentStart = timelineStartRef.current;
    const currentEnd = timelineEndRef.current;

    // Direct state updates - larger buffer for better prefetching
    if (direction === 'start') {
      const newStart = addDays(currentStart, -35);
      setTimelineStart(newStart);
      
      // When expanding backwards, we need to adjust scroll position
      // to maintain visual continuity (35 days * DAY_CELL_WIDTH)
      requestAnimationFrame(() => {
        if (timelineRowsRef.current) {
          timelineRowsRef.current.scrollLeft = currentScrollLeft + (35 * LAYOUT.DAY_CELL_WIDTH);
          if (stickyHeadersRef.current) {
            stickyHeadersRef.current.scrollLeft = currentScrollLeft + (35 * LAYOUT.DAY_CELL_WIDTH);
          }
        }
      });
    } else {
      const newEnd = addDays(currentEnd, 35);
      setTimelineEnd(newEnd);
      // No scroll adjustment needed when expanding forwards
    }
    
    setTimeout(() => {
      loadingRef.current = false;
    }, 200);
  }, []);

  // FAST: Scroll to center the selected date (NO expensive formatting!)
  const scrollToDate = useCallback((targetDate: Date, animate = true) => {
    // PERFORMANCE: Use fast date comparison instead of expensive string formatting
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    
    const targetIndex = timelineDates.findIndex(date => {
      const timelineDate = new Date(date);
      timelineDate.setHours(0, 0, 0, 0);
      return timelineDate.getTime() === target.getTime();
    });
    
    if (targetIndex === -1 || !timelineRowsRef.current) return;
    
    const dayWidth = LAYOUT.DAY_CELL_WIDTH;
    const targetPosition = targetIndex * dayWidth;
    const containerWidth = timelineRowsRef.current.clientWidth;
    const scrollLeft = Math.max(0, targetPosition - (containerWidth / 2) + (dayWidth / 2));
    
    // Scroll both timeline and header
    if (animate) {
      timelineRowsRef.current.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
      if (stickyHeadersRef.current) {
        stickyHeadersRef.current.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        });
      }
    } else {
      timelineRowsRef.current.scrollLeft = scrollLeft;
      if (stickyHeadersRef.current) {
        stickyHeadersRef.current.scrollLeft = scrollLeft;
      }
    }
  }, [timelineDates]);
  
  // OPTIMIZED: Set initial scroll position to center today (40-day timeline)
  useEffect(() => {
    if (timelineDates.length > 0 && !hasInitialScrolled.current && timelineRowsRef.current) {
      hasInitialScrolled.current = true;
      
      // PERFORMANCE: Use simple date arithmetic instead of expensive formatting
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to start of day
      
      // Find today's index using fast date comparison (today should be at index ~20)
      const todayIndex = timelineDates.findIndex(date => {
        const timelineDate = new Date(date);
        timelineDate.setHours(0, 0, 0, 0);
        return timelineDate.getTime() === today.getTime();
      });
      
      if (todayIndex !== -1) {
        const dayWidth = LAYOUT.DAY_CELL_WIDTH;
        const targetPosition = todayIndex * dayWidth;
        const containerWidth = timelineRowsRef.current.clientWidth;
        const scrollLeft = Math.max(0, targetPosition - (containerWidth / 2) + (dayWidth / 2));
        
        // Set position directly - instant, no lag
        timelineRowsRef.current.scrollLeft = scrollLeft;
        if (stickyHeadersRef.current) {
          stickyHeadersRef.current.scrollLeft = scrollLeft;
        }
      }
    }
  }, [timelineDates.length]);

  // Handle user date selection changes (with animation)
  useEffect(() => {
    if (hasInitialScrolled.current) {
      scrollToDate(selectedDate, true);
    }
  }, [selectedDate, scrollToDate]);

  // FAST: Lightweight date formatting - only what's needed!
  const formattedDates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateNormalized = new Date(selectedDate);
    selectedDateNormalized.setHours(0, 0, 0, 0);
    
    return timelineDates.map(date => {
      const normalizedDate = new Date(date);
      normalizedDate.setHours(0, 0, 0, 0);
      
      return {
        date,
        dateStr: format(date, 'yyyy-MM-dd'), // Only format when actually needed
        isToday: normalizedDate.getTime() === today.getTime(),
        isSelected: normalizedDate.getTime() === selectedDateNormalized.getTime(),
        isWeekendDay: isWeekend(date)
      };
    });
  }, [timelineDates, selectedDate]);

  // Month sections with alternating backgrounds - enhanced for year transitions
  const monthSections = useMemo(() => {
    const sections = [];
    let currentSection = null;
    
    timelineDates.forEach((date, index) => {
      const monthYear = format(date, 'yyyy-MM'); // Only format when building sections
      
      if (!currentSection || currentSection.monthYear !== monthYear) {
        // Finish previous section
        if (currentSection) {
          currentSection.endIndex = index - 1;
          currentSection.width = (currentSection.endIndex - currentSection.startIndex + 1) * LAYOUT.DAY_CELL_WIDTH;
          sections.push(currentSection);
        }
        
        // Check if this is a new year for enhanced styling
        const isNewYear = sections.length > 0 && 
          date.getFullYear() !== sections[sections.length - 1].date.getFullYear();
        
        // Start new section
        currentSection = {
          monthYear,
          date: date,
          startIndex: index,
          endIndex: index,
          width: 0,
          isEven: sections.length % 2 === 0,
          isNewYear
        };
      }
    });
    
    // Don't forget the last section
    if (currentSection) {
      currentSection.endIndex = timelineDates.length - 1;
      currentSection.width = (currentSection.endIndex - currentSection.startIndex + 1) * LAYOUT.DAY_CELL_WIDTH;
      sections.push(currentSection);
    }
    
    return sections;
  }, [timelineDates]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Calculate visible date range based on scroll position and viewport
  const [visibleDateRange, setVisibleDateRange] = useState<{start: Date, end: Date}>({
    start: timelineStart,
    end: timelineEnd
  });

  // Function to calculate visible dates from scroll position
  const updateVisibleRange = useCallback(() => {
    if (!timelineRowsRef.current) return;
    
    const scrollContainer = timelineRowsRef.current;
    const scrollLeft = scrollContainer.scrollLeft;
    const containerWidth = scrollContainer.clientWidth;
    
    const dayWidth = LAYOUT.DAY_CELL_WIDTH;
    const visibleStartIndex = Math.floor(scrollLeft / dayWidth);
    const visibleEndIndex = Math.ceil((scrollLeft + containerWidth) / dayWidth);
    
    // Reasonable buffer for smooth transitions
    const bufferDays = 3;
    const startIndex = Math.max(0, visibleStartIndex - bufferDays);
    const endIndex = Math.min(timelineDates.length - 1, visibleEndIndex + bufferDays);
    
    if (timelineDates[startIndex] && timelineDates[endIndex]) {
      const newStart = timelineDates[startIndex];
      const newEnd = timelineDates[endIndex];
      
      // Only update if the dates actually changed
      if (newStart.getTime() !== visibleDateRange.start.getTime() || 
          newEnd.getTime() !== visibleDateRange.end.getTime()) {
        setVisibleDateRange({ start: newStart, end: newEnd });
      }
    }
  }, [timelineDates, visibleDateRange.start, visibleDateRange.end]);

  // REMOVED: Complex scroll event listener - not needed for simple behavior

  return {
    timelineStart,
    timelineEnd,
    timelineDates,
    formattedDates,
    monthSections,
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
    equipmentRowsRef: timelineRowsRef, // Use shared ref for both planners
    stickyHeadersRef,
    loadMoreDates,
    scrollToDate,
    // Visible date range for project filtering
    visibleTimelineStart: visibleDateRange.start,
    visibleTimelineEnd: visibleDateRange.end,
  };
}