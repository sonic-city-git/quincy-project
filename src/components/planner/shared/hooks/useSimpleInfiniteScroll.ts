/**
 * 🎯 SIMPLE INFINITE SCROLL
 * 
 * Clean infinite scrolling experience without over-engineering:
 * - Single expansion trigger (no velocity complexity)
 * - Stable scroll positioning 
 * - No RAF retries or race conditions
 * - Maintains smooth infinite scroll UX
 */

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { addDays, format, isWeekend, differenceInDays } from 'date-fns';
import { LAYOUT } from '../constants';

interface UseSimpleInfiniteScrollProps {
  selectedDate: Date;
}

export function useSimpleInfiniteScroll({ selectedDate }: UseSimpleInfiniteScrollProps) {
  
  // ========================
  // SIMPLE STATE
  // ========================
  
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  // Start with reasonable buffer around today
  const [timelineStart, setTimelineStart] = useState(() => addDays(today, -30));
  const [timelineEnd, setTimelineEnd] = useState(() => addDays(today, 90));
  const [scrollPosition, setScrollPosition] = useState(0);
  
  // Simple refs - no complex tracking
  const equipmentRowsRef = useRef<HTMLDivElement>(null);
  const stickyHeadersRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);
  const isExpandingRef = useRef(false);
  const lastScrolledDateRef = useRef('');
  
  // ========================
  // TIMELINE DATES
  // ========================
  
  const timelineDates = useMemo(() => {
    const dates = [];
    let currentDate = new Date(timelineStart);
    while (currentDate <= timelineEnd) {
      dates.push(new Date(currentDate));
      currentDate = addDays(currentDate, 1);
    }
    return dates;
  }, [timelineStart, timelineEnd]);

  const formattedDates = useMemo(() => {
    const todayNormalized = new Date(today);
    const selectedNormalized = new Date(selectedDate);
    selectedNormalized.setHours(0, 0, 0, 0);
    
    return timelineDates.map(date => {
      const normalizedDate = new Date(date);
      normalizedDate.setHours(0, 0, 0, 0);
      
      return {
        date,
        dateStr: format(date, 'yyyy-MM-dd'),
        isToday: normalizedDate.getTime() === todayNormalized.getTime(),
        isSelected: normalizedDate.getTime() === selectedNormalized.getTime(),
        isWeekendDay: isWeekend(date)
      };
    });
  }, [timelineDates, selectedDate, today]);

  // ========================
  // SIMPLE EXPANSION
  // ========================
  
  const expandTimeline = useCallback((direction: 'start' | 'end', days: number = 42) => {
    if (isExpandingRef.current) return;
    
    isExpandingRef.current = true;
    
    if (direction === 'start') {
      // Backward expansion - preserve scroll position
      const currentScrollLeft = scrollPositionRef.current;
      const pixelAdjustment = days * LAYOUT.DAY_CELL_WIDTH;
      
      setTimelineStart(prev => addDays(prev, -days));
      
      // Simple position adjustment - no RAF loops
      setTimeout(() => {
        if (equipmentRowsRef.current && stickyHeadersRef.current) {
          const newScrollLeft = currentScrollLeft + pixelAdjustment;
          equipmentRowsRef.current.scrollLeft = newScrollLeft;
          stickyHeadersRef.current.scrollLeft = newScrollLeft;
          scrollPositionRef.current = newScrollLeft;
          setScrollPosition(newScrollLeft);
        }
        isExpandingRef.current = false;
      }, 50); // Single timeout, no retries
      
    } else {
      // Forward expansion - no position adjustment needed
      setTimelineEnd(prev => addDays(prev, days));
      isExpandingRef.current = false;
    }
  }, []);

  // ========================
  // INFINITE SCROLL DETECTION
  // ========================
  
  const checkForExpansion = useCallback((scrollLeft: number, scrollWidth: number, clientWidth: number) => {
    // Simple thresholds - no velocity complexity
    const EXPAND_THRESHOLD = 2000; // 2000px from edge
    const EXPANSION_DAYS = 42; // 6 weeks
    
    const nearStart = scrollLeft < EXPAND_THRESHOLD;
    const nearEnd = scrollLeft > (scrollWidth - clientWidth - EXPAND_THRESHOLD);
    
    if (nearStart) {
      console.log('🚀 Expanding backward: Adding', EXPANSION_DAYS, 'days');
      expandTimeline('start', EXPANSION_DAYS);
    } else if (nearEnd) {
      console.log('🚀 Expanding forward: Adding', EXPANSION_DAYS, 'days');
      expandTimeline('end', EXPANSION_DAYS);
    }
  }, [expandTimeline]);

  // ========================
  // SCROLL HANDLERS
  // ========================
  
  const scrollTo = useCallback((position: number, smooth: boolean = false) => {
    if (!equipmentRowsRef.current || !stickyHeadersRef.current) return;
    
    const maxScroll = Math.max(0, equipmentRowsRef.current.scrollWidth - equipmentRowsRef.current.clientWidth);
    const clampedPosition = Math.max(0, Math.min(position, maxScroll));
    
    if (smooth) {
      equipmentRowsRef.current.scrollTo({ left: clampedPosition, behavior: 'smooth' });
      stickyHeadersRef.current.scrollTo({ left: clampedPosition, behavior: 'smooth' });
    } else {
      equipmentRowsRef.current.scrollLeft = clampedPosition;
      stickyHeadersRef.current.scrollLeft = clampedPosition;
    }
    
    scrollPositionRef.current = clampedPosition;
    setScrollPosition(clampedPosition);
  }, []);

  const scrollToDate = useCallback((targetDate: Date, smooth: boolean = false) => {
    if (!timelineDates.length || !equipmentRowsRef.current?.clientWidth) return;
    
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    
    const targetIndex = timelineDates.findIndex(date => {
      const timelineDate = new Date(date);
      timelineDate.setHours(0, 0, 0, 0);
      return timelineDate.getTime() === target.getTime();
    });
    
    if (targetIndex === -1) {
      // Date not found - expand timeline once and retry
      const firstDate = timelineDates[0];
      const lastDate = timelineDates[timelineDates.length - 1];
      
      if (target < firstDate) {
        const daysDiff = Math.ceil(differenceInDays(firstDate, target));
        expandTimeline('start', Math.max(42, daysDiff + 14));
        setTimeout(() => scrollToDate(targetDate, smooth), 200); // Single retry
      } else if (target > lastDate) {
        const daysDiff = Math.ceil(differenceInDays(target, lastDate));
        expandTimeline('end', Math.max(42, daysDiff + 14));
        setTimeout(() => scrollToDate(targetDate, smooth), 200); // Single retry
      }
      return;
    }
    
    // Position date at 25% of viewport
    const dayWidth = LAYOUT.DAY_CELL_WIDTH;
    const containerWidth = equipmentRowsRef.current.clientWidth;
    const targetPosition = targetIndex * dayWidth;
    const scrollPosition = targetPosition - (containerWidth * 0.25);
    
    scrollTo(Math.max(0, scrollPosition), smooth);
  }, [timelineDates, expandTimeline, scrollTo]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const { scrollLeft, scrollWidth, clientWidth } = element;
    
    // Update position
    scrollPositionRef.current = scrollLeft;
    setScrollPosition(scrollLeft);
    
    // Sync other scroll containers
    if (element !== equipmentRowsRef.current && equipmentRowsRef.current) {
      equipmentRowsRef.current.scrollLeft = scrollLeft;
    }
    if (element !== stickyHeadersRef.current && stickyHeadersRef.current) {
      stickyHeadersRef.current.scrollLeft = scrollLeft;
    }
    
    // Check for infinite scroll expansion
    checkForExpansion(scrollLeft, scrollWidth, clientWidth);
  }, [checkForExpansion]);

  // ========================
  // DATE CHANGE EFFECT
  // ========================
  
  useEffect(() => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    
    // Only scroll if date actually changed
    if (lastScrolledDateRef.current === dateStr) {
      return;
    }
    
    // Only scroll if container is ready
    if (timelineDates.length > 0 && equipmentRowsRef.current?.clientWidth > 0) {
      console.log('📍 Scrolling to selectedDate:', dateStr);
      scrollToDate(selectedDate);
      lastScrolledDateRef.current = dateStr;
    }
  }, [selectedDate.getTime(), timelineDates.length, scrollToDate]);

  // ========================
  // RETURN CLEAN INTERFACE
  // ========================
  
  return {
    // Timeline data
    timelineStart,
    timelineEnd,
    timelineDates,
    formattedDates,
    
    // Simple - no virtualization complexity
    virtualTimeline: {
      virtualDates: formattedDates,
      totalWidth: formattedDates.length * LAYOUT.DAY_CELL_WIDTH,
      offsetLeft: 0,
      isVirtualized: false
    },
    
    // Scroll state
    scrollPosition,
    equipmentRowsRef,
    stickyHeadersRef,
    
    // Functions
    scrollTo,
    scrollToDate,
    
    // Event handlers
    handleScroll,
    
    // Simplified - no drag support for now
    isDragging: false,
    handleMouseDown: () => {},
    handleMouseMove: () => {},
    handleMouseUp: () => {},
    handleMouseLeave: () => {},
    
    // Container width for compatibility
    containerWidth: equipmentRowsRef.current?.clientWidth || 1200,
    updateContainerWidth: () => {}
  };
}