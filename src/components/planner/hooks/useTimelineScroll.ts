import { RefObject, useCallback, useEffect, useRef } from 'react';

interface UseTimelineScrollProps {
  timelineRef: RefObject<HTMLDivElement>;
  equipmentRowsRef: RefObject<HTMLDivElement>;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  dragStart: { x: number; scrollLeft: number };
  setDragStart: (start: { x: number; scrollLeft: number }) => void;
  loadMoreDates: (direction: 'start' | 'end') => void;
  isMonthView: boolean;
}

export function useTimelineScroll({
  timelineRef,
  equipmentRowsRef,
  isDragging,
  setIsDragging,
  dragStart,
  setDragStart,
  loadMoreDates,
  isMonthView,
}: UseTimelineScrollProps) {
  
  // Debounced scroll state
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll handlers
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const { scrollLeft, scrollWidth, clientWidth } = element;
    
    // Sync master equipment scroll area when timeline header scrolls
    if (element === timelineRef.current && equipmentRowsRef.current) {
      equipmentRowsRef.current.scrollLeft = scrollLeft;
    }
    
    // Debounced loading check for performance
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      // More aggressive threshold for smaller timeline
      const threshold = 0.2;
      
      if (scrollLeft < scrollWidth * threshold) {
        loadMoreDates('start');
      } else if (scrollLeft > scrollWidth * (1 - threshold) - clientWidth) {
        loadMoreDates('end');
      }
    }, 50); // 50ms debounce for smooth scrolling
  }, [timelineRef, equipmentRowsRef, loadMoreDates]);

  // Sync timeline header when master equipment scroll area scrolls
  const handleEquipmentScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const { scrollLeft, scrollWidth, clientWidth } = element;
    
    // Immediate sync with timeline header
    if (timelineRef.current && timelineRef.current.scrollLeft !== scrollLeft) {
      timelineRef.current.scrollLeft = scrollLeft;
    }
    
    // Debounced loading check for performance
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      // More aggressive threshold for smaller timeline
      const threshold = 0.2;
      
      if (scrollLeft < scrollWidth * threshold) {
        loadMoreDates('start');
      } else if (scrollLeft > scrollWidth * (1 - threshold) - clientWidth) {
        loadMoreDates('end');
      }
    }, 50); // 50ms debounce for smooth scrolling
  }, [timelineRef, loadMoreDates]);

  // Mouse drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    setIsDragging(true);
    setDragStart({
      x: e.pageX - timelineRef.current.offsetLeft,
      scrollLeft: timelineRef.current.scrollLeft,
    });
  }, [timelineRef, setIsDragging, setDragStart]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !timelineRef.current) return;
    e.preventDefault();
    const x = e.pageX - timelineRef.current.offsetLeft;
    const walk = (x - dragStart.x) * 2;
    timelineRef.current.scrollLeft = dragStart.scrollLeft - walk;
  }, [isDragging, timelineRef, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, [setIsDragging]);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, [setIsDragging]);

  // Navigation functions
  const navigatePeriod = useCallback((direction: 'prev' | 'next') => {
    if (!timelineRef.current) return;
    
    const daysToMove = isMonthView ? 30 : 7;
    const dayWidth = 50;
    const scrollAmount = dayWidth * daysToMove;
    
    timelineRef.current.scrollBy({
      left: direction === 'next' ? scrollAmount : -scrollAmount,
      behavior: 'smooth'
    });
  }, [timelineRef, isMonthView]);

  const navigateDays = useCallback((direction: 'prev' | 'next') => {
    if (!timelineRef.current) return;
    
    const daysToMove = isMonthView ? 7 : 1;
    const dayWidth = 50;
    const scrollAmount = dayWidth * daysToMove;
    
    timelineRef.current.scrollBy({
      left: direction === 'next' ? scrollAmount : -scrollAmount,
      behavior: 'smooth'
    });
  }, [timelineRef, isMonthView]);

  // Cursor management
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

  // Cleanup scroll timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    handleScroll,
    handleEquipmentScroll,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    navigatePeriod,
    navigateDays,
  };
}