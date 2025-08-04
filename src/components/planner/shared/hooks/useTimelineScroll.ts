/**
 * 🎯 CONSOLIDATED TIMELINE SCROLL
 * 
 * One simple hook that does everything we need:
 * - Timeline dates and scroll position
 * - Smooth expansion when nearing edges
 * - Date selection and navigation
 * - Drag scrolling
 * - Debug metrics (dev only)
 * 
 * Replaces 7 hooks with 1 focused implementation.
 */

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { addDays, format, isWeekend, differenceInDays } from 'date-fns';
import { LAYOUT, PERFORMANCE } from '../constants';

interface UseTimelineScrollProps {
  selectedDate: Date;
}

interface ScrollMetrics {
  velocity: number;
  direction: 'left' | 'right' | 'idle';
  expansions: number;
  smoothness: number; // 0-1 scale
}

export function useTimelineScroll({ selectedDate }: UseTimelineScrollProps) {
  
  // ========================
  // CORE STATE
  // ========================
  
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  // Asymmetric range: past -10, future +30 days
  const [timelineStart, setTimelineStart] = useState(() => addDays(today, -10));
  const [timelineEnd, setTimelineEnd] = useState(() => addDays(today, 30));
  
  // Scroll state
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 });
  
  // Refs for DOM elements and tracking
  const equipmentRowsRef = useRef<HTMLDivElement>(null);
  const stickyHeadersRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);
  const lastScrollUpdateRef = useRef(0);
  const scrollAnimationFrameRef = useRef<number | null>(null);
  const lastScrollSourceRef = useRef<HTMLDivElement | null>(null);
  
  // Expansion tracking
  const isExpandingRef = useRef(false);
  const expansionCountRef = useRef(0);
  const lastExpansionTimeRef = useRef(0);
  
  // Performance tracking (dev only)
  const metricsRef = useRef<ScrollMetrics>({
    velocity: 0,
    direction: 'idle',
    expansions: 0,
    smoothness: 1,
  });
  const lastScrollTimeRef = useRef(0);
  const scrollHistoryRef = useRef<Array<{ time: number; position: number }>>([]);

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
  // VIRTUAL TIMELINE RENDERING - Throttled and Optimized
  // ========================
  
  const [containerWidth, setContainerWidth] = useState(1200);
  const lastVirtualUpdateRef = useRef(0);
  const cachedVirtualTimelineRef = useRef(null);
  
  // OPTIMIZED: Memoized virtual timeline with throttled updates
  const virtualTimeline = useMemo(() => {
    const now = performance.now();
    
    // Throttle virtual timeline updates to 60fps
    if (now - lastVirtualUpdateRef.current < PERFORMANCE.VIRTUAL_UPDATE_THROTTLE && cachedVirtualTimelineRef.current) {
      // Return cached calculation if too soon
      return cachedVirtualTimelineRef.current;
    }
    
    lastVirtualUpdateRef.current = now;
    
    const buffer = PERFORMANCE.HORIZONTAL_VIRTUALIZATION_BUFFER;
    const cellWidth = LAYOUT.DAY_CELL_WIDTH;
    const totalWidth = formattedDates.length * cellWidth;
    
    // IMPROVED: Only virtualize if we have a lot of dates AND it's worth the complexity
    // Add hysteresis to prevent rapid switching between virtual/non-virtual modes
    const wasVirtualized = cachedVirtualTimelineRef.current?.isVirtualized || false;
    const virtualizationThreshold = wasVirtualized 
      ? PERFORMANCE.MAX_RENDERED_DAYS * 0.8  // 20% hysteresis when leaving virtual mode
      : PERFORMANCE.MAX_RENDERED_DAYS;       // Normal threshold when entering virtual mode
    
    const shouldVirtualize = formattedDates.length > virtualizationThreshold && containerWidth > 0;
    
    if (!shouldVirtualize) {
      // Render all dates for better performance on smaller timelines
      const result = {
        virtualDates: formattedDates,
        totalWidth,
        offsetLeft: 0,
        virtualStart: 0,
        virtualEnd: formattedDates.length,
        isVirtualized: false
      };
      
      // Cache the result for throttling
      cachedVirtualTimelineRef.current = result;
      return result;
    }
    
    // Calculate visible range based on scroll position
    const startIndex = Math.floor(scrollPosition / cellWidth);
    const visibleCount = Math.ceil(containerWidth / cellWidth);
    
    // Add generous buffer on both sides for smooth scrolling
    const virtualStart = Math.max(0, startIndex - buffer);
    const virtualEnd = Math.min(formattedDates.length, startIndex + visibleCount + buffer);
    
    // Get virtual slice of dates
    const virtualDates = formattedDates.slice(virtualStart, virtualEnd);
    
    // Calculate offset for proper positioning
    const offsetLeft = virtualStart * cellWidth;
    
    const result = {
      virtualDates,
      totalWidth,
      offsetLeft,
      virtualStart,
      virtualEnd,
      isVirtualized: true
    };
    
    // Cache the result for throttling
    cachedVirtualTimelineRef.current = result;
    return result;
  }, [scrollPosition, formattedDates, containerWidth]);
  
  // Track container width for accurate virtualization - Throttled
  const updateContainerWidth = useCallback(() => {
    if (equipmentRowsRef.current) {
      const width = equipmentRowsRef.current.clientWidth;
      // Only update if significantly different to prevent unnecessary re-renders
      if (Math.abs(width - containerWidth) > 50) {
        setContainerWidth(width);
      }
    }
  }, [containerWidth]);
  
  // Update container width on resize - Throttled
  useEffect(() => {
    updateContainerWidth();
    
    // Throttle resize updates to prevent excessive virtual timeline recalculations
    let resizeTimeout: NodeJS.Timeout;
    const throttledUpdate = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateContainerWidth, 100);
    };
    
    const resizeObserver = new ResizeObserver(throttledUpdate);
    if (equipmentRowsRef.current) {
      resizeObserver.observe(equipmentRowsRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
      clearTimeout(resizeTimeout);
    };
  }, [updateContainerWidth]);

  // ========================
  // SMOOTH EXPANSION
  // ========================
  
  const expandTimeline = useCallback((direction: 'start' | 'end', days: number = 35) => {
    if (isExpandingRef.current) return;
    
    isExpandingRef.current = true;
    expansionCountRef.current++;
    lastExpansionTimeRef.current = performance.now();
    
    const currentScrollLeft = scrollPositionRef.current;

    if (direction === 'start') {
      // OPTIMIZED: Atomic backward expansion with position preservation
      const pixelAdjustment = days * LAYOUT.DAY_CELL_WIDTH;
      
      // Update timeline data
      setTimelineStart(prev => addDays(prev, -days));
      
      // OPTIMIZED: Single atomic position adjustment using MutationObserver
      const adjustPosition = () => {
        if (!equipmentRowsRef.current || !stickyHeadersRef.current) return false;
        
        const newScrollLeft = currentScrollLeft + pixelAdjustment;
        const equipmentEl = equipmentRowsRef.current;
        const headerEl = stickyHeadersRef.current;
        
        // Verify DOM has sufficient width
        if (equipmentEl.scrollWidth < newScrollLeft + equipmentEl.clientWidth) {
          return false;
        }
        
        // Apply position atomically to both elements
        equipmentEl.scrollLeft = newScrollLeft;
        headerEl.scrollLeft = newScrollLeft;
        scrollPositionRef.current = newScrollLeft;
        setScrollPosition(newScrollLeft);
        
        return true;
      };
      
      // OPTIMIZED: Use requestAnimationFrame for smooth position adjustment
      let attempts = 0;
      const maxAttempts = 10;
      
      const tryAdjustPosition = () => {
        attempts++;
        
        if (adjustPosition()) {
          // Success - expansion complete
          isExpandingRef.current = false;
          console.log(`✅ Backward expansion complete after ${attempts} attempts`);
          return;
        }
        
        if (attempts < maxAttempts) {
          // Retry on next frame
          requestAnimationFrame(tryAdjustPosition);
        } else {
          // Fallback: final attempt with setTimeout
          console.warn(`⚠️ Backward expansion fallback after ${attempts} attempts`);
          setTimeout(() => {
            adjustPosition();
            isExpandingRef.current = false;
          }, 50);
        }
      };
      
      // Start position adjustment on next frame
      requestAnimationFrame(tryAdjustPosition);
      
    } else {
      // OPTIMIZED: Forward expansion with immediate cleanup
      setTimelineEnd(prev => addDays(prev, days));
      
      // Forward expansion doesn't need position adjustment
      requestAnimationFrame(() => {
        isExpandingRef.current = false;
      });
    }
  }, []);

  // ========================
  // SMART EXPANSION DETECTION
  // ========================
  
  const checkForExpansion = useCallback((scrollLeft: number, scrollWidth: number, clientWidth: number, velocity: number = 0, direction: string = 'idle') => {
    // OPTIMIZED: Dynamic thresholds based on scroll velocity
    const BASE_THRESHOLD = 2000; // Increased from 800px for better preloading
    const VELOCITY_MULTIPLIER = 10; // Additional threshold per unit velocity
    const MAX_THRESHOLD = 3500; // Cap the threshold for reasonable memory usage
    
    const dynamicThreshold = Math.min(
      BASE_THRESHOLD + (velocity * VELOCITY_MULTIPLIER),
      MAX_THRESHOLD
    );
    
    // OPTIMIZED: Adaptive cooldown based on velocity
    const BASE_COOLDOWN = 300; // Reduced from 1000ms for faster response
    const MIN_COOLDOWN = 100; // Minimum cooldown for high-velocity scrolling
    const adaptiveCooldown = velocity > 2 ? MIN_COOLDOWN : BASE_COOLDOWN;
    
    const now = performance.now();
    if (now - lastExpansionTimeRef.current < adaptiveCooldown) return;
    
    const nearStart = scrollLeft < dynamicThreshold;
    const nearEnd = scrollLeft > (scrollWidth - clientWidth - dynamicThreshold);
    
    // OPTIMIZED: Larger expansion for high-velocity scrolling
    const baseExpansionDays = 35;
    const velocityExpansionBonus = velocity > 3 ? 14 : 0; // Add 2 weeks for fast scrolling
    const expansionDays = baseExpansionDays + velocityExpansionBonus;
    
    if (nearStart && (direction === 'left' || direction === 'idle')) {
      console.log(`🚀 Expanding timeline backward: velocity=${velocity.toFixed(1)}, threshold=${dynamicThreshold}px, days=${expansionDays}`);
      expandTimeline('start', expansionDays);
    } else if (nearEnd && (direction === 'right' || direction === 'idle')) {
      console.log(`🚀 Expanding timeline forward: velocity=${velocity.toFixed(1)}, threshold=${dynamicThreshold}px, days=${expansionDays}`);
      expandTimeline('end', expansionDays);
    }
  }, [expandTimeline]);

  // ========================
  // CORE SCROLL FUNCTION
  // ========================
  
  const scrollTo = useCallback((position: number, options: { smooth?: boolean } = {}) => {
    if (!equipmentRowsRef.current || !stickyHeadersRef.current) return;
    
    const { smooth = false } = options;
    const maxScroll = Math.max(0, equipmentRowsRef.current.scrollWidth - equipmentRowsRef.current.clientWidth);
    const clampedPosition = Math.max(0, Math.min(position, maxScroll));
    
    if (smooth) {
      equipmentRowsRef.current.scrollTo({ left: clampedPosition, behavior: 'smooth' });
      stickyHeadersRef.current.scrollTo({ left: clampedPosition, behavior: 'smooth' });
    } else {
      equipmentRowsRef.current.scrollLeft = clampedPosition;
      stickyHeadersRef.current.scrollLeft = clampedPosition;
    }
    
    setScrollPosition(clampedPosition);
    scrollPositionRef.current = clampedPosition;
  }, []);

  // ========================
  // DATE NAVIGATION
  // ========================
  
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
      // Date not found - expand timeline if needed
      const firstDate = timelineDates[0];
      const lastDate = timelineDates[timelineDates.length - 1];
      
      if (target < firstDate) {
        const daysDiff = Math.ceil(differenceInDays(firstDate, target));
        expandTimeline('start', Math.max(35, daysDiff + 14));
        setTimeout(() => scrollToDate(targetDate, smooth), 300);
      } else if (target > lastDate) {
        const daysDiff = Math.ceil(differenceInDays(target, lastDate));
        expandTimeline('end', Math.max(35, daysDiff + 14));
        setTimeout(() => scrollToDate(targetDate, smooth), 300);
      }
      return;
    }
    
    // Simple: Position date at 25% of viewport
    const dayWidth = LAYOUT.DAY_CELL_WIDTH;
    const containerWidth = equipmentRowsRef.current.clientWidth;
    const targetPosition = targetIndex * dayWidth;
    const scrollPosition = targetPosition - (containerWidth * 0.25);
    
    console.log('🎯 ScrollToDate:', {
      date: target.toISOString().split('T')[0],
      targetIndex,
      dayWidth,
      containerWidth,
      targetPosition,
      scrollPosition: Math.max(0, scrollPosition)
    });
    
    scrollTo(scrollPosition, { smooth });
  }, [timelineDates, expandTimeline, scrollTo]);

  // ========================
  // EVENT HANDLERS
  // ========================
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    
    const element = e.currentTarget;
    const { scrollLeft, scrollWidth, clientWidth } = element;
    const now = performance.now();
    
    // Update position reference
    scrollPositionRef.current = scrollLeft;
    
    // OPTIMIZED: Always track velocity for production infinite scroll
    scrollHistoryRef.current.push({ time: now, position: scrollLeft });
    if (scrollHistoryRef.current.length > 5) {
      scrollHistoryRef.current = scrollHistoryRef.current.slice(-5);
    }
    
    // Calculate velocity and direction
    let velocity = 0;
    let direction: 'left' | 'right' | 'idle' = 'idle';
    
    if (scrollHistoryRef.current.length >= 2) {
      const recent = scrollHistoryRef.current;
      const timeDiff = recent[recent.length - 1].time - recent[0].time;
      const positionDiff = recent[recent.length - 1].position - recent[0].position;
      
      velocity = timeDiff > 0 ? Math.abs(positionDiff) / timeDiff : 0;
      direction = positionDiff > 0 ? 'right' : positionDiff < 0 ? 'left' : 'idle';
      
      // Update metrics for debugging
      metricsRef.current.velocity = velocity;
      metricsRef.current.direction = direction;
    }
    
    // Sync scroll between elements
    if (lastScrollSourceRef.current !== element) {
      lastScrollSourceRef.current = element;
      
      if (scrollAnimationFrameRef.current) {
        cancelAnimationFrame(scrollAnimationFrameRef.current);
      }
      
      scrollAnimationFrameRef.current = requestAnimationFrame(() => {
        if (stickyHeadersRef.current && element !== stickyHeadersRef.current) {
          stickyHeadersRef.current.scrollLeft = scrollLeft;
        }
        if (equipmentRowsRef.current && element !== equipmentRowsRef.current) {
          equipmentRowsRef.current.scrollLeft = scrollLeft;
        }
        
        // Throttled state update
        if (now - lastScrollUpdateRef.current > 50) {
          setScrollPosition(scrollLeft);
          lastScrollUpdateRef.current = now;
        }
        
        lastScrollSourceRef.current = null;
        scrollAnimationFrameRef.current = null;
      });
    }
    
    // OPTIMIZED: Check for expansion with velocity data
    checkForExpansion(scrollLeft, scrollWidth, clientWidth, velocity, direction);
  }, [checkForExpansion]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!equipmentRowsRef.current) return;
    setIsDragging(true);
    setDragStart({
      x: e.pageX - equipmentRowsRef.current.offsetLeft,
      scrollLeft: scrollPositionRef.current,
    });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !equipmentRowsRef.current) return;
    e.preventDefault();
    
    const x = e.pageX - equipmentRowsRef.current.offsetLeft;
    const deltaX = (x - dragStart.x) * 2;
    const newPosition = dragStart.scrollLeft - deltaX;
    
    scrollTo(newPosition);
  }, [isDragging, dragStart, scrollTo]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // ========================
  // SIMPLE DATE POSITIONING
  // ========================
  
  useEffect(() => {
    // Simple: When selectedDate changes and we have timeline data, scroll to it
    if (timelineDates.length > 0) {
      console.log('📍 Timeline scroll: selectedDate changed to', selectedDate.toISOString().split('T')[0], 'with', timelineDates.length, 'dates');
      
      // Wait for DOM to be ready, then scroll
      const attemptScroll = () => {
        if (equipmentRowsRef.current?.clientWidth > 0) {
          console.log('✅ Container ready, scrolling to date');
          scrollToDate(selectedDate);
        } else {
          console.log('⏳ Container not ready, retrying...');
          setTimeout(attemptScroll, 50);
        }
      };
      
      // Start attempting after a small delay
      setTimeout(attemptScroll, 100);
    } else {
      console.log('📍 Timeline scroll: waiting for timeline data. Current dates:', timelineDates.length);
    }
  }, [selectedDate, timelineDates.length, scrollToDate]);

  // ========================
  // CLEANUP
  // ========================
  
  useEffect(() => {
    return () => {
      if (scrollAnimationFrameRef.current) {
        cancelAnimationFrame(scrollAnimationFrameRef.current);
      }
    };
  }, []);

  // ========================
  // RETURN INTERFACE
  // ========================
  
  return {
    // Timeline data
    timelineStart,
    timelineEnd,
    timelineDates,
    formattedDates,
    
    // VIRTUAL TIMELINE - Performance optimized rendering
    virtualTimeline,
    containerWidth,
    updateContainerWidth,
    
    // Scroll state
    scrollPosition,
    equipmentRowsRef,
    stickyHeadersRef,
    
    // Functions
    scrollTo,
    scrollToDate,
    
    // Drag state
    isDragging,
    
    // Event handlers
    handleScroll,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave: handleMouseUp,
    
    // Debug info (dev only)
    debug: process.env.NODE_ENV === 'development' ? {
      metrics: metricsRef.current,
      expansions: expansionCountRef.current,
      isExpanding: isExpandingRef.current,
      virtualInfo: {
        totalDates: formattedDates.length,
        virtualDates: virtualTimeline.virtualDates.length,
        isVirtualized: virtualTimeline.isVirtualized,
        virtualRange: `${virtualTimeline.virtualStart}-${virtualTimeline.virtualEnd}`
      }
    } : undefined,
  };
}