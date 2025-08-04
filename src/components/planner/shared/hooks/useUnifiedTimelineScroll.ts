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
  
  // Use a single "today" reference
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  // Load asymmetric date range to match 25/75 viewport split
  const [timelineStart, setTimelineStart] = useState(() => addDays(today, -10));  // 10 days in the past
  const [timelineEnd, setTimelineEnd] = useState(() => addDays(today, 30));   // 30 days into the future



  // ========================
  // CENTRAL SCROLL STATE
  // ========================
  
  const equipmentRowsRef = useRef<HTMLDivElement>(null);
  const stickyHeadersRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  
  // Scroll operation tracking
  const activeOperationRef = useRef<string | null>(null);
  
  // Use ref instead of state for isScrolling to avoid React timing issues
  const isScrollingRef = useRef(false);
  
  // Safety mechanism to prevent stuck scroll state
  const scrollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    // Remove console logs for better performance
    // console.log('Calculating timeline dates', { timelineStart, timelineEnd });
    const dates = [];
    let currentDate = new Date(timelineStart);
    while (currentDate <= timelineEnd) {
      dates.push(new Date(currentDate));
      currentDate = addDays(currentDate, 1);
    }
    // console.log('Timeline dates calculated', { length: dates.length });
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
    
    if (!equipmentRowsRef.current || !stickyHeadersRef.current) return false;
    
    // Set active operation
    activeOperationRef.current = source;
    
    // Clamp position to valid range
    const maxScroll = Math.max(0, equipmentRowsRef.current.scrollWidth - equipmentRowsRef.current.clientWidth);
    const clampedPosition = Math.max(0, Math.min(position, maxScroll));
    
    // Only log for important scroll operations
    if (source === 'date' || source === 'navigation') {
      // Removed console.log for production performance
    }
    
    if (smooth) {
      // Set scrolling state to prevent interference
      isScrollingRef.current = true;
      
      // Safety timeout to prevent stuck scrolling state
      if (scrollingTimeoutRef.current) {
        clearTimeout(scrollingTimeoutRef.current);
      }
      scrollingTimeoutRef.current = setTimeout(() => {
        // Emergency reset - should rarely be needed now
        activeOperationRef.current = null;
        isScrollingRef.current = false;
      }, 1000);
      
      // 🎨 PHYSICS-BASED SMOOTH ANIMATION
      // Creates a natural scrolling feel with:
      // - Subtle anticipation (tiny reverse movement)
      // - Smooth acceleration with elastic feel  
      // - Spring-damped deceleration with slight overshoot
      // - Organic momentum variations
      
      const startPosition = equipmentRowsRef.current.scrollLeft;
      const distance = clampedPosition - startPosition;
      
      // Physics-based animation parameters for natural scrolling feel
      const distanceRange = Math.abs(distance);
      
      // Adaptive duration for luxurious, smooth feel
      const baseDuration = 280; // Base duration for medium distances (increased for smoother feel)
      const minDuration = 200;  // Minimum for very short distances
      const maxDuration = 500;  // Maximum for very long distances  
      const duration = Math.min(maxDuration, Math.max(minDuration, baseDuration + distanceRange * 0.06));
      
      // Spring physics parameters for natural momentum
      const springTension = 0.8;  // How "tight" the spring is
      const springFriction = 0.9; // How much friction/damping
      
      const startTime = performance.now();
      let lastFrameTime = startTime;
      let velocity = 0;
      
      const animateScroll = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const deltaTime = currentTime - lastFrameTime;
        lastFrameTime = currentTime;
        
        const progress = Math.min(elapsed / duration, 1);
        
        // Advanced easing with natural physics-based movement
        let easeValue;
        
        if (progress < 0.05) {
          // Tiny anticipation movement (like real scrolling momentum)
          const anticipation = progress / 0.05;
          easeValue = -0.008 * Math.sin(anticipation * Math.PI); // Subtle reverse movement
        } else if (progress < 0.6) {
          // Smooth acceleration with elastic feel
          const t = (progress - 0.05) / 0.55;
          easeValue = 0.6 * t * t * (3 - 2 * t); // Smooth hermite interpolation
        } else {
          // Physics-based deceleration with spring damping
          const t = (progress - 0.6) / 0.4;
          const overshoot = 1 + 0.15 * Math.exp(-5 * t) * Math.sin(15 * t); // Spring overshoot
          const damping = 1 - Math.pow(1 - t, 2.5); // Smooth deceleration
          easeValue = 0.6 + 0.4 * damping * overshoot;
        }
        
        // Add subtle momentum variation for organic feel
        const momentum = 1 + Math.sin(progress * Math.PI * 2) * 0.008; // Very subtle oscillation
        const finalEase = Math.max(0, Math.min(1, easeValue * momentum)); // Clamp to valid range
        
        const currentPosition = startPosition + (distance * finalEase);
        
        // Scroll both containers simultaneously with sub-pixel precision
        if (equipmentRowsRef.current && stickyHeadersRef.current) {
          equipmentRowsRef.current.scrollLeft = currentPosition;
          stickyHeadersRef.current.scrollLeft = currentPosition;
          // Update position state in real-time for responsive feel
          setScrollPosition(currentPosition);
        }
        
        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        } else {
          // Animation complete - immediate state reset with refs
          activeOperationRef.current = null;
          isScrollingRef.current = false;
          setScrollPosition(clampedPosition);
          
          // Clear safety timeout since animation completed normally
          if (scrollingTimeoutRef.current) {
            clearTimeout(scrollingTimeoutRef.current);
            scrollingTimeoutRef.current = null;
          }
          
          // Removed console.log for production performance
        }
      };
      
      // Start immediately on next frame
      requestAnimationFrame(animateScroll);
    } else {
      // Instant scroll both containers
      equipmentRowsRef.current.scrollLeft = clampedPosition;
      stickyHeadersRef.current.scrollLeft = clampedPosition;
      
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
    // Remove debug logging for better performance
    // console.log('scrollToDate called', {
    //   targetDate,
    //   timelineDatesLength: timelineDates.length,
    //   hasRef: !!equipmentRowsRef.current,
    //   width: equipmentRowsRef.current?.clientWidth
    // });
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
    
    if (targetIndex === -1) {
      // Date not found in timeline - expanding timeline range
      return;
    }
    
    // Position the date at 25% of the viewport (leaving 75% for future dates)
    const dayWidth = LAYOUT.DAY_CELL_WIDTH;
    const targetPosition = targetIndex * dayWidth;
    const quarterWidth = containerWidth * 0.25;
    const scrollPosition = targetPosition - quarterWidth + (dayWidth / 2);
    
    // Centering date in timeline view
    if (targetIndex >= 0) {
      // Removed console.log for production performance
    }
    
    scrollTo(scrollPosition, { smooth: true, source: 'date' });
  }, [timelineDates, scrollTo]);

  // ========================
  // INITIAL CENTERING ON SELECTED DATE
  // ========================
  
  // Track initial centering
  const initialCenteringDone = useRef(false);

  // Center on selectedDate when timeline and ref are ready
  const selectedDateRef = useRef(selectedDate);
  selectedDateRef.current = selectedDate;

  useEffect(() => {
    if (!initialCenteringDone.current && timelineDates.length > 0 && equipmentRowsRef.current) {
      // Wait for next frame to ensure DOM is ready
      requestAnimationFrame(() => {
        if (equipmentRowsRef.current?.clientWidth) {
          initialCenteringDone.current = true;
          scrollToDate(selectedDateRef.current);
        }
      });
    }
  }, [timelineDates.length, equipmentRowsRef.current]); // Remove selectedDate dependency


  const dragScroll = useCallback((deltaX: number) => {
    const newPosition = dragStart.scrollLeft - deltaX;
    
    // Cancel any pending animation frame
    if (scrollAnimationFrameRef.current) {
      cancelAnimationFrame(scrollAnimationFrameRef.current);
    }
    
    // Update ref immediately (no re-render during drag)
    scrollPositionRef.current = newPosition;
    
    // Use RAF for smooth synchronization
    scrollAnimationFrameRef.current = requestAnimationFrame(() => {
      // Update both containers
      if (equipmentRowsRef.current) {
        equipmentRowsRef.current.scrollLeft = newPosition;
      }
      if (stickyHeadersRef.current) {
        stickyHeadersRef.current.scrollLeft = newPosition;
      }
      
      // Only update React state occasionally during drag for performance
      const now = performance.now();
      if (now - lastScrollUpdateRef.current > 16) { // ~60fps max during drag
        setScrollPosition(newPosition);
        lastScrollUpdateRef.current = now;
      }
      
      scrollAnimationFrameRef.current = null;
    });
  }, [dragStart.scrollLeft]);

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
  
  // Debounced scroll handler for performance
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track the last scroll source to prevent loops
  const lastScrollSourceRef = useRef<HTMLDivElement | null>(null);
  const scrollAnimationFrameRef = useRef<number | null>(null);

  // Add ref to track scroll position without triggering re-renders
  const scrollPositionRef = useRef(0);
  const lastScrollUpdateRef = useRef(0);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const { scrollLeft, scrollWidth, clientWidth } = element;
    
    // Block all scroll events during smooth scroll to prevent interference
    if (isScrollingRef.current || activeOperationRef.current) {
      return;
    }

    // Update ref immediately (no re-render)
    scrollPositionRef.current = scrollLeft;

    // Cancel any pending animation frame to prevent rapid updates
    if (scrollAnimationFrameRef.current) {
      cancelAnimationFrame(scrollAnimationFrameRef.current);
    }
    
    // Throttle React state updates to reduce re-renders
    const now = performance.now();
    const shouldUpdateState = now - lastScrollUpdateRef.current > 50; // Max 20fps for state updates
    
    // Only sync if this is a new scroll source
    if (lastScrollSourceRef.current !== element) {
      lastScrollSourceRef.current = element;
      
      // Use RAF for smooth synchronization
      scrollAnimationFrameRef.current = requestAnimationFrame(() => {
        // Only update the element that didn't trigger the scroll
        if (stickyHeadersRef.current && element !== stickyHeadersRef.current) {
          stickyHeadersRef.current.scrollLeft = scrollLeft;
        }
        if (equipmentRowsRef.current && element !== equipmentRowsRef.current) {
          equipmentRowsRef.current.scrollLeft = scrollLeft;
        }
        
        // Update React state only if enough time has passed (throttling)
        if (shouldUpdateState) {
          setScrollPosition(scrollLeft);
          lastScrollUpdateRef.current = now;
        }
        
        // Clear the scroll source after sync
        lastScrollSourceRef.current = null;
        scrollAnimationFrameRef.current = null;
      });
    }
    
    // Debounce infinite scroll detection
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      // Infinite scroll detection
      const FETCH_THRESHOLD = 1000;
      const endThreshold = scrollWidth - clientWidth - FETCH_THRESHOLD;
      
      if (scrollLeft < FETCH_THRESHOLD || scrollLeft > endThreshold) {
        const direction = scrollLeft < FETCH_THRESHOLD ? 'start' : 'end';
        expandTimeline(direction);
      }
    }, 200);
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
  
  // Note: Date scrolling is now handled immediately on click for better responsiveness
  // No useEffect needed - direct calls from onDateChange prevent React state update delays

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
      // Clear all timeouts and animation frames
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (scrollingTimeoutRef.current) {
        clearTimeout(scrollingTimeoutRef.current);
      }
      if (scrollAnimationFrameRef.current) {
        cancelAnimationFrame(scrollAnimationFrameRef.current);
      }
      // Reset refs
      lastScrollSourceRef.current = null;
      scrollAnimationFrameRef.current = null;
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
    isScrolling: isScrollingRef.current, // For preventing interference during smooth scrolls
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