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
  
  // SCROLL MANAGEMENT: Prevent conflicts between multiple scroll triggers
  const isScrolling = useRef(false);
  const scrollSource = useRef<'user' | 'programmatic' | 'initial' | 'target'>('user');
  const activeScrollTimeouts = useRef<NodeJS.Timeout[]>([]);
  
  // Clear all active scroll timeouts
  const clearScrollTimeouts = useCallback(() => {
    activeScrollTimeouts.current.forEach(timeout => clearTimeout(timeout));
    activeScrollTimeouts.current = [];
    isScrolling.current = false;
  }, []);

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
    
    // Don't expand timeline if programmatic scrolling is happening
    if (isScrolling.current) {
      return;
    }
    
    loadingRef.current = true;
    lastLoadTime.current = now;

    // COORDINATED: Preserve scroll position when expanding timeline
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
        if (timelineRowsRef.current && !isScrolling.current) {
          // Only adjust if no other scrolling is happening
          const newScrollLeft = currentScrollLeft + (35 * LAYOUT.DAY_CELL_WIDTH);
          timelineRowsRef.current.scrollLeft = newScrollLeft;
          if (stickyHeadersRef.current) {
            stickyHeadersRef.current.scrollLeft = newScrollLeft;
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

  // FAST: Responsive scroll to center the selected date
  const scrollToDate = useCallback((targetDate: Date, animate = true, source: 'user' | 'programmatic' | 'initial' | 'target' = 'programmatic') => {
    // For user interactions, be immediate - no conflict prevention needed
    if (source === 'user') {
      clearScrollTimeouts();
    } else if (isScrolling.current && scrollSource.current === 'user') {
      // Don't interrupt user scrolling with programmatic scrolls
      return;
    }
    
    // PERFORMANCE: Use fast date comparison instead of expensive string formatting
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    
    const targetIndex = timelineDates.findIndex(date => {
      const timelineDate = new Date(date);
      timelineDate.setHours(0, 0, 0, 0);
      return timelineDate.getTime() === target.getTime();
    });
    
    if (targetIndex === -1 || !timelineRowsRef.current) return;
    
    // Lighter scroll state tracking
    const wasScrolling = isScrolling.current;
    isScrolling.current = true;
    scrollSource.current = source;
    
    const dayWidth = LAYOUT.DAY_CELL_WIDTH;
    const targetPosition = targetIndex * dayWidth;
    const containerWidth = timelineRowsRef.current.clientWidth;
    const scrollLeft = Math.max(0, targetPosition - (containerWidth / 2) + (dayWidth / 2));
    
    // Scroll both timeline and header
    if (animate && source !== 'user') {
      // Only animate for non-user interactions to avoid lag feel
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
      
      // Shorter timeout for faster response
      const timeout = setTimeout(() => {
        isScrolling.current = false;
        scrollSource.current = 'user';
      }, 300); // Reduced from 500ms
      activeScrollTimeouts.current.push(timeout);
    } else {
      // Instant scrolling for user interactions and initial loads
      timelineRowsRef.current.scrollLeft = scrollLeft;
      if (stickyHeadersRef.current) {
        stickyHeadersRef.current.scrollLeft = scrollLeft;
      }
      
      // Clear scroll state immediately for instant scrolls
      setTimeout(() => {
        isScrolling.current = false;
        scrollSource.current = 'user';
      }, 50); // Minimal delay to prevent conflicts
    }
  }, [timelineDates, clearScrollTimeouts]);
  
  // CLEAN: Set initial scroll position to center today (simplified)
  useEffect(() => {
    if (timelineDates.length > 0 && !hasInitialScrolled.current) {
      const centerTodayWhenReady = () => {
        if (!timelineRowsRef.current) {
          // Container not ready, try again
          requestAnimationFrame(centerTodayWhenReady);
          return;
        }
        
        const containerWidth = timelineRowsRef.current.clientWidth;
        if (containerWidth === 0) {
          // Container width not ready, try again
          requestAnimationFrame(centerTodayWhenReady);
          return;
        }
        
        hasInitialScrolled.current = true;
        
        // Use the coordinated scroll function for initial centering
        const today = new Date();
        scrollToDate(today, false, 'initial'); // No animation for initial centering
      };
      
      // Start the centering process
      requestAnimationFrame(centerTodayWhenReady);
    }
  }, [timelineDates.length, scrollToDate]);

  // Handle date selection changes - instant for better UX
  useEffect(() => {
    if (hasInitialScrolled.current) {
      // Use instant scroll for date selection to feel more responsive
      scrollToDate(selectedDate, false, 'user');
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

  // Cleanup animation and scroll timeouts on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      clearScrollTimeouts();
    };
  }, [clearScrollTimeouts]);

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

  // Check if timeline is currently scrolling programmatically
  const isTimelineScrolling = useCallback(() => {
    return isScrolling.current;
  }, []);

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
    // Scroll conflict management
    isTimelineScrolling,
    clearScrollTimeouts,
    // Visible date range for project filtering
    visibleTimelineStart: visibleDateRange.start,
    visibleTimelineEnd: visibleDateRange.end,
  };
}