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

// TypeScript declaration for shared timeline state
declare global {
  interface Window {
    plannerTimelineState?: {
      timelineStart: Date;
      timelineEnd: Date;
      scrollPosition: number;
      hasInitialScrolled: boolean;
    };
  }
}

interface UseSimpleInfiniteScrollProps {
  selectedDate: Date;
  targetScrollItem?: {
    type: 'equipment' | 'crew';
    id: string;
  } | null;
}

export function useSimpleInfiniteScroll({ selectedDate, targetScrollItem }: UseSimpleInfiniteScrollProps) {
  
  // ========================
  // SIMPLE STATE
  // ========================
  
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  // SHARED TIMELINE STATE: Use global state manager to persist across tab switches  
  const getSharedTimelineState = useCallback(() => {
    if (typeof window !== 'undefined' && window.plannerTimelineState) {
      return window.plannerTimelineState;
    }
    
    // Initialize shared state
    const sharedState = {
      timelineStart: addDays(today, -60),
      timelineEnd: addDays(today, 90),
      scrollPosition: 60 * LAYOUT.DAY_CELL_WIDTH,
      hasInitialScrolled: false
    };
    
    if (typeof window !== 'undefined') {
      window.plannerTimelineState = sharedState;
    }
    
    return sharedState;
  }, [today]);

  const sharedState = getSharedTimelineState();
  
  const [timelineStart, setTimelineStartLocal] = useState(sharedState.timelineStart);
  const [timelineEnd, setTimelineEndLocal] = useState(sharedState.timelineEnd);
  const [scrollPosition, setScrollPositionLocal] = useState(sharedState.scrollPosition);
  const [hasInitialScrolled, setHasInitialScrolledLocal] = useState(sharedState.hasInitialScrolled);

  // Wrapper setters that update both local and shared state
  const setTimelineStart = useCallback((date: Date) => {
    setTimelineStartLocal(date);
    if (typeof window !== 'undefined' && window.plannerTimelineState) {
      window.plannerTimelineState.timelineStart = date;
    }
  }, []);

  const setTimelineEnd = useCallback((date: Date) => {
    setTimelineEndLocal(date);
    if (typeof window !== 'undefined' && window.plannerTimelineState) {
      window.plannerTimelineState.timelineEnd = date;
    }
  }, []);

  const setScrollPosition = useCallback((position: number) => {
    setScrollPositionLocal(position);
    if (typeof window !== 'undefined' && window.plannerTimelineState) {
      window.plannerTimelineState.scrollPosition = position;
    }
  }, []);

  const setHasInitialScrolled = useCallback((scrolled: boolean) => {
    setHasInitialScrolledLocal(scrolled);
    if (typeof window !== 'undefined' && window.plannerTimelineState) {
      window.plannerTimelineState.hasInitialScrolled = scrolled;
    }
  }, []);

  // Shared state is now updated directly in the setter functions above
  
  // Constants
  const initialScroll = 60 * LAYOUT.DAY_CELL_WIDTH; // today is 60 days from start
  
  // Container readiness state
  const [containerMounted, setContainerMounted] = useState(false);
  
  // Refs with callback to detect mounting
  const equipmentRowsRef = useRef<HTMLDivElement>(null);
  const stickyHeadersRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(scrollPosition);
  const isExpandingRef = useRef(false);
  
  // Ref callback to detect when container is ready
  const setEquipmentRowsRef = useCallback((element: HTMLDivElement | null) => {
    equipmentRowsRef.current = element;
    if (element?.clientWidth > 0) {
      console.log('📦 Container just mounted with width:', element.clientWidth);
      setContainerMounted(true);
    }
  }, []);
  
  // Alternative: Watch for container mounting via ref changes
  useEffect(() => {
    if (equipmentRowsRef.current?.clientWidth && !containerMounted) {
      console.log('📦 Container detected via ref with width:', equipmentRowsRef.current.clientWidth);
      setContainerMounted(true);
    }
  }, [equipmentRowsRef.current, containerMounted]);
  
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
      // Date not in timeline - should not happen for today's date since we start with today ± buffer
      console.warn('📍 Date not found in timeline:', targetDate.toISOString().split('T')[0]);
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
  // SCROLL TO TODAY WHEN READY
  // ========================
  
  // SIMPLE: Single effect that waits for everything to be ready
  useEffect(() => {
    console.log('📊 Readiness check:', {
      timelineDatesLength: timelineDates.length,
      containerMounted,
      containerWidth: equipmentRowsRef.current?.clientWidth,
      hasInitialScrolled: hasInitialScrolled,
      selectedDate: format(selectedDate, 'MMM dd'),
      initialScroll
    });
    
    // Wait for timeline data AND containers to be ready
    if (timelineDates.length > 0 && containerMounted && equipmentRowsRef.current) {
      
      // For initial load: set position to prevent jump, then scroll to today
      if (!hasInitialScrolled) {
        console.log('🎯 INITIAL LOAD: Setting position and scrolling to', format(selectedDate, 'MMM dd'));
        
        // Set initial position first (prevent jump)
        if (stickyHeadersRef.current) {
          equipmentRowsRef.current.scrollLeft = initialScroll;
          stickyHeadersRef.current.scrollLeft = initialScroll;
          console.log('✅ Set initial scroll position to:', initialScroll);
        }
        
        setHasInitialScrolled(true);
      } else {
        console.log('🎯 DATE CHANGE: Scrolling to', format(selectedDate, 'MMM dd'));
      }
      
      // Always scroll to selected date (handles both initial + date changes)
      setTimeout(() => scrollToDate(selectedDate), 10);
    }
  }, [timelineDates.length, containerMounted, selectedDate, initialScroll, hasInitialScrolled, setHasInitialScrolled]); // Everything that matters

  // TAB SWITCH DETECTION: Always scroll to selectedDate when timeline is ready (for tab switches)
  useEffect(() => {
    // If we have timeline data, container is ready, and we've done initial scroll,
    // make sure selectedDate is visible (important for tab switches)
    if (timelineDates.length > 0 && containerMounted && equipmentRowsRef.current && hasInitialScrolled) {
      console.log('🔄 TAB SWITCH: Ensuring selectedDate is visible:', format(selectedDate, 'MMM dd'));
      setTimeout(() => scrollToDate(selectedDate), 50);
    }
  }, [timelineDates.length, containerMounted, hasInitialScrolled, selectedDate, scrollToDate]);

  // Handle targetScrollItem (moved from UnifiedCalendar for single scroll location)
  useEffect(() => {
    if (targetScrollItem && equipmentRowsRef.current) {
      const timer = setTimeout(() => {
        const targetElement = document.querySelector(`[data-resource-id="${targetScrollItem.id}"]`);
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 200); // After initial scroll
      
      return () => clearTimeout(timer);
    }
  }, [targetScrollItem]);

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
    equipmentRowsRef, // Return the actual ref object  
    setEquipmentRowsRef, // Also provide callback ref for flexibility
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