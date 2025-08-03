import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { addDays, format, isWeekend } from 'date-fns';
import { LAYOUT } from '../constants';

interface UseSharedTimelineProps {
  selectedDate: Date;
}

export function useSharedTimeline({ selectedDate }: UseSharedTimelineProps) {
  // STABLE timeline range - prevent "pop" by using consistent initial date
  const [timelineStart, setTimelineStart] = useState(() => {
    // Use today's date for stable initialization, not the passed selectedDate which might change
    const today = new Date();
    return addDays(today, -35);
  });
  const [timelineEnd, setTimelineEnd] = useState(() => {
    const today = new Date();
    return addDays(today, 35);
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 });
  
  // Shared scroll container ref for both Equipment and Crew planners
  const timelineRowsRef = useRef<HTMLDivElement>(null);
  const stickyHeadersRef = useRef<HTMLDivElement>(null);
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

  // Simple scroll to center the selected date
  const scrollToDate = useCallback((targetDate: Date, animate = true) => {
    const targetDateStr = format(targetDate, 'yyyy-MM-dd');
    const targetIndex = timelineDates.findIndex(date => 
      format(date, 'yyyy-MM-dd') === targetDateStr
    );
    
    if (targetIndex === -1 || !timelineRowsRef.current) return;
    
    const dayWidth = LAYOUT.DAY_CELL_WIDTH;
    const targetPosition = targetIndex * dayWidth;
    const containerWidth = timelineRowsRef.current.clientWidth;
    const scrollLeft = targetPosition - (containerWidth / 2) + (dayWidth / 2);
    
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
  
  // Simple scroll logic:
  // 1. On browser refresh → scroll to today (no animation)
  // 2. When selectedDate changes → scroll to that date (with animation)
  
  // FIXED: Separate timeline range from scroll operations to prevent racing
  
  // 1. Initialize timeline range once on mount
  useEffect(() => {
    if (!hasInitialScrolled.current) {
      hasInitialScrolled.current = true;
      const today = new Date();
      setTimelineStart(addDays(today, -35));
      setTimelineEnd(addDays(today, 35));
    }
  }, []); // No dependencies - run once on mount
  
  // 2. Scroll to initial date after timeline is built (only once)
  const hasScrolledToInitial = useRef(false);
  useEffect(() => {
    if (hasInitialScrolled.current && timelineDates.length > 0 && !hasScrolledToInitial.current) {
      hasScrolledToInitial.current = true;
      const timer = setTimeout(() => {
        scrollToDate(new Date(), false);
      }, 50); // Small delay to ensure timeline is rendered
      return () => clearTimeout(timer);
    }
  }, [timelineDates.length > 0 ? 'ready' : 'loading']); // Stable dependency

  // 3. Handle date selection (scroll only, don't change timeline range)
  useEffect(() => {
    if (hasInitialScrolled.current) {
      scrollToDate(selectedDate, true);
    }
  }, [selectedDate]);

  // Pre-format dates for performance - avoid repeated format() calls
  const baseDates = useMemo(() => {
    return timelineDates.map(date => ({
      date,
      dateStr: format(date, 'yyyy-MM-dd'),
      isoString: date.toISOString(),
      isWeekendDay: isWeekend(date),
      monthYear: format(date, 'yyyy-MM')
    }));
  }, [timelineDates]);

  const formattedDates = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    
    return baseDates.map(baseDate => ({
      ...baseDate,
      isToday: baseDate.dateStr === todayStr,
      isSelected: baseDate.dateStr === selectedDateStr
    }));
  }, [baseDates, selectedDate]);

  // Month sections with alternating backgrounds - enhanced for year transitions
  const monthSections = useMemo(() => {
    const sections = [];
    let currentSection = null;
    
    baseDates.forEach((dateInfo, index) => {
      if (!currentSection || currentSection.monthYear !== dateInfo.monthYear) {
        // Finish previous section
        if (currentSection) {
          currentSection.endIndex = index - 1;
          currentSection.width = (currentSection.endIndex - currentSection.startIndex + 1) * LAYOUT.DAY_CELL_WIDTH;
          sections.push(currentSection);
        }
        
        // Check if this is a new year for enhanced styling
        const isNewYear = sections.length > 0 && 
          dateInfo.date.getFullYear() !== sections[sections.length - 1].date.getFullYear();
        
        // Start new section
        currentSection = {
          monthYear: dateInfo.monthYear,
          date: dateInfo.date,
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
      currentSection.endIndex = baseDates.length - 1;
      currentSection.width = (currentSection.endIndex - currentSection.startIndex + 1) * LAYOUT.DAY_CELL_WIDTH;
      sections.push(currentSection);
    }
    
    return sections;
  }, [baseDates]);

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