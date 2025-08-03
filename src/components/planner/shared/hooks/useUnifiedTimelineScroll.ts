/**
 * 🎯 UNIFIED TIMELINE SCROLL SYSTEM
 * 
 * ONE hook to rule them all - manages:
 * - Timeline dates and state
 * - Central scroll position 
 * - All scroll operations (center, drag, navigate)
 * - Refs (no more passing around)
 * - Infinite scroll
 * 
 * Everything calls ONE scrollTo function with position.
 */

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { addDays, format, isWeekend } from 'date-fns';
import { LAYOUT } from '../constants';

interface UseUnifiedTimelineScrollProps {
  selectedDate: Date;
}

export function useUnifiedTimelineScroll({ selectedDate }: UseUnifiedTimelineScrollProps) {
  // ========================
  // TIMELINE STATE
  // ========================
  
  const [timelineStart, setTimelineStart] = useState(() => {
    const today = new Date();
    return addDays(today, -20);
  });
  const [timelineEnd, setTimelineEnd] = useState(() => {
    const today = new Date();
    return addDays(today, 20);
  });

  // ========================
  // CENTRAL SCROLL STATE
  // ========================
  
  const equipmentRowsRef = useRef<HTMLDivElement>(null);
  const stickyHeadersRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  
  // Scroll operation tracking
  const activeOperationRef = useRef<string | null>(null);
  const operationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ========================
  // DRAG STATE  
  // ========================
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 });

  // ========================
  // INFINITE SCROLL STATE
  // ========================
  
  const loadingRef = useRef(false);
  const lastLoadTime = useRef(0);
  const LOAD_COOLDOWN = 300;

  // ========================
  // TIMELINE DATES (memoized)
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

  // ========================
  // CENTRAL SCROLL FUNCTION
  // ========================
  
  const scrollTo = useCallback((
    position: number, 
    options: {
      smooth?: boolean;
      source?: 'date' | 'drag' | 'navigation' | 'expansion' | 'sync';
    } = {}
  ) => {
    const { smooth = false, source = 'manual' } = options;
    
    if (!equipmentRowsRef.current) return false;
    
    // Clear any active operation timeout
    if (operationTimeoutRef.current) {
      clearTimeout(operationTimeoutRef.current);
    }
    
    // Set active operation
    activeOperationRef.current = source;
    
    // Clamp position to valid range
    const maxScroll = Math.max(0, equipmentRowsRef.current.scrollWidth - equipmentRowsRef.current.clientWidth);
    const clampedPosition = Math.max(0, Math.min(position, maxScroll));
    
    // Execute scroll on both containers
    if (smooth) {
      equipmentRowsRef.current.scrollTo({ left: clampedPosition, behavior: 'smooth' });
      if (stickyHeadersRef.current) {
        stickyHeadersRef.current.scrollTo({ left: clampedPosition, behavior: 'smooth' });
      }
      
      // Clear operation after animation completes
      operationTimeoutRef.current = setTimeout(() => {
        activeOperationRef.current = null;
      }, 500);
    } else {
      equipmentRowsRef.current.scrollLeft = clampedPosition;
      if (stickyHeadersRef.current) {
        stickyHeadersRef.current.scrollLeft = clampedPosition;
      }
      
      // Clear operation immediately for instant scroll
      setTimeout(() => {
        activeOperationRef.current = null;
      }, 50);
    }
    
    // Update central position state
    setScrollPosition(clampedPosition);
    return true;
  }, []);

  // ========================
  // CONVENIENCE FUNCTIONS
  // ========================
  
  const scrollToDate = useCallback((targetDate: Date) => {
    if (!timelineDates.length || !equipmentRowsRef.current) return;
    
    const containerWidth = equipmentRowsRef.current.clientWidth;
    if (containerWidth === 0) return;
    
    // Find the selected date in timeline
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    
    const targetIndex = timelineDates.findIndex(date => {
      const timelineDate = new Date(date);
      timelineDate.setHours(0, 0, 0, 0);
      return timelineDate.getTime() === target.getTime();
    });
    
    if (targetIndex === -1) return;
    
    // Calculate centered scroll position
    const dayWidth = LAYOUT.DAY_CELL_WIDTH;
    const targetPosition = targetIndex * dayWidth;
    const centeredPosition = targetPosition - (containerWidth / 2) + (dayWidth / 2);
    
    scrollTo(centeredPosition, { smooth: true, source: 'date' });
  }, [timelineDates, scrollTo]);

  const dragScroll = useCallback((deltaX: number) => {
    const newPosition = dragStart.scrollLeft - deltaX;
    scrollTo(newPosition, { smooth: false, source: 'drag' });
  }, [dragStart.scrollLeft, scrollTo]);

  const navigate = useCallback((direction: 'prev' | 'next', amount: 'day' | 'week' | 'month') => {
    const dayWidth = LAYOUT.DAY_CELL_WIDTH;
    let daysToMove = 1;
    
    if (amount === 'week') daysToMove = 7;
    if (amount === 'month') daysToMove = 30;
    
    const scrollAmount = dayWidth * daysToMove;
    const newPosition = direction === 'next' ? 
      scrollPosition + scrollAmount : 
      scrollPosition - scrollAmount;
    
    scrollTo(newPosition, { smooth: true, source: 'navigation' });
  }, [scrollPosition, scrollTo]);

  // ========================
  // INFINITE SCROLL 
  // ========================
  
  const expandTimeline = useCallback((direction: 'start' | 'end') => {
    const now = Date.now();
    
    if (loadingRef.current || (now - lastLoadTime.current) < LOAD_COOLDOWN) {
      return;
    }
    
    // Don't expand if actively scrolling
    if (activeOperationRef.current && activeOperationRef.current !== 'sync') {
      return;
    }
    
    loadingRef.current = true;
    lastLoadTime.current = now;

    const currentScrollLeft = scrollPosition;

    if (direction === 'start') {
      const newStart = addDays(timelineStart, -35);
      setTimelineStart(newStart);
      
      // Adjust scroll position to maintain visual continuity
      requestAnimationFrame(() => {
        const newScrollLeft = currentScrollLeft + (35 * LAYOUT.DAY_CELL_WIDTH);
        scrollTo(newScrollLeft, { smooth: false, source: 'expansion' });
      });
    } else {
      const newEnd = addDays(timelineEnd, 35);
      setTimelineEnd(newEnd);
    }
    
    setTimeout(() => {
      loadingRef.current = false;
    }, 200);
  }, [scrollPosition, timelineStart, timelineEnd, scrollTo]);

  // ========================
  // EVENT HANDLERS
  // ========================
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const { scrollLeft, scrollWidth, clientWidth } = element;
    
    // Update central position if not from our own scrollTo
    if (activeOperationRef.current !== 'date' && activeOperationRef.current !== 'navigation') {
      setScrollPosition(scrollLeft);
      
      // Sync headers if this is user scroll
      if (stickyHeadersRef.current && activeOperationRef.current !== 'sync') {
        activeOperationRef.current = 'sync';
        stickyHeadersRef.current.scrollLeft = scrollLeft;
        setTimeout(() => {
          if (activeOperationRef.current === 'sync') {
            activeOperationRef.current = null;
          }
        }, 50);
      }
    }
    
    // Infinite scroll detection
    const dataFetchThreshold = 1000;
    const startDataThreshold = dataFetchThreshold;
    const endDataThreshold = scrollWidth - clientWidth - dataFetchThreshold;
    
    if (scrollLeft < startDataThreshold || scrollLeft > endDataThreshold) {
      const direction = scrollLeft < startDataThreshold ? 'start' : 'end';
      expandTimeline(direction);
    }
  }, [expandTimeline]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!equipmentRowsRef.current) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.pageX - equipmentRowsRef.current.offsetLeft,
      scrollLeft: scrollPosition,
    });
  }, [scrollPosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !equipmentRowsRef.current) return;
    e.preventDefault();
    
    const x = e.pageX - equipmentRowsRef.current.offsetLeft;
    const deltaX = (x - dragStart.x) * 2; // 2x multiplier for faster dragging
    dragScroll(deltaX);
  }, [isDragging, dragStart.x, dragScroll]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // ========================
  // SELECTED DATE EFFECT
  // ========================
  
  useEffect(() => {
    scrollToDate(selectedDate);
  }, [selectedDate, scrollToDate]);

  // ========================
  // FORMATTED DATES (memoized)
  // ========================
  
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
        dateStr: format(date, 'yyyy-MM-dd'),
        isToday: normalizedDate.getTime() === today.getTime(),
        isSelected: normalizedDate.getTime() === selectedDateNormalized.getTime(),
        isWeekendDay: isWeekend(date)
      };
    });
  }, [timelineDates, selectedDate]);

  // ========================
  // MONTH SECTIONS (memoized)
  // ========================
  
  const monthSections = useMemo(() => {
    const sections = [];
    let currentSection = null;
    
    timelineDates.forEach((date, index) => {
      const monthYear = format(date, 'yyyy-MM');
      
      if (!currentSection || currentSection.monthYear !== monthYear) {
        if (currentSection) {
          currentSection.endIndex = index - 1;
          currentSection.width = (currentSection.endIndex - currentSection.startIndex + 1) * LAYOUT.DAY_CELL_WIDTH;
          sections.push(currentSection);
        }
        
        const isNewYear = sections.length > 0 && 
          date.getFullYear() !== sections[sections.length - 1].date.getFullYear();
        
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
    
    if (currentSection) {
      currentSection.endIndex = timelineDates.length - 1;
      currentSection.width = (currentSection.endIndex - currentSection.startIndex + 1) * LAYOUT.DAY_CELL_WIDTH;
      sections.push(currentSection);
    }
    
    return sections;
  }, [timelineDates]);

  // ========================
  // CURSOR MANAGEMENT
  // ========================
  
  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  // ========================
  // CLEANUP
  // ========================
  
  useEffect(() => {
    return () => {
      if (operationTimeoutRef.current) {
        clearTimeout(operationTimeoutRef.current);
      }
    };
  }, []);

  // ========================
  // RETURN EVERYTHING
  // ========================
  
  return {
    // Timeline state
    timelineStart,
    timelineEnd,
    timelineDates,
    formattedDates,
    monthSections,
    
    // Central scroll state
    scrollPosition,
    equipmentRowsRef,
    stickyHeadersRef,
    
    // Central scroll function
    scrollTo,
    scrollToDate,
    navigate,
    
    // Drag state  
    isDragging,
    dragStart,
    
    // Event handlers
    handleScroll,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave: handleMouseUp, // Same as mouse up
    
    // Legacy compatibility (can remove once updated)
    loadMoreDates: expandTimeline,
    setIsDragging,
    setDragStart,
  };
}