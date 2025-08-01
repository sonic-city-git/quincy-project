import { RefObject, useCallback, useEffect, useRef } from 'react';

interface UseTimelineScrollProps {
  timelineRef?: RefObject<HTMLDivElement>; // Now optional - for static headers
  equipmentRowsRef: RefObject<HTMLDivElement>; // Master scroll area
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
  
  // Pre-calculate threshold to avoid repeated calculations
  const threshold = 0.3;

  // Simplified: Single master scroll handler
  const handleEquipmentScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const { scrollLeft, scrollWidth, clientWidth } = element;
    
    // Debounced loading check for performance
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      // Pre-calculated threshold values for better performance
      const startThreshold = scrollWidth * threshold;
      const endThreshold = scrollWidth * (1 - threshold) - clientWidth;
      
      if (scrollLeft < startThreshold) {
        loadMoreDates('start');
      } else if (scrollLeft > endThreshold) {
        loadMoreDates('end');
      }
    }, 100); // Smooth infinite loading
  }, [loadMoreDates, threshold]);

  // Simplified: Mouse drag handlers for master scroll area
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!equipmentRowsRef.current) return;
    setIsDragging(true);
    setDragStart({
      x: e.pageX - equipmentRowsRef.current.offsetLeft,
      scrollLeft: equipmentRowsRef.current.scrollLeft,
    });
  }, [equipmentRowsRef, setIsDragging, setDragStart]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !equipmentRowsRef.current) return;
    e.preventDefault();
    
    // Use requestAnimationFrame to throttle mouse move updates for smooth dragging
    requestAnimationFrame(() => {
      if (!equipmentRowsRef.current || !isDragging) return;
      
      const x = e.pageX - equipmentRowsRef.current.offsetLeft;
      const walk = (x - dragStart.x) * 2;
      // Natural scroll direction: drag right to see future, drag left to see past
      equipmentRowsRef.current.scrollLeft = dragStart.scrollLeft - walk;
    });
  }, [isDragging, equipmentRowsRef, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, [setIsDragging]);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, [setIsDragging]);

  // Simplified: Navigation functions for master scroll area
  const navigatePeriod = useCallback((direction: 'prev' | 'next') => {
    if (!equipmentRowsRef.current) return;
    
    const daysToMove = isMonthView ? 30 : 7;
    const dayWidth = 50;
    const scrollAmount = dayWidth * daysToMove;
    
    equipmentRowsRef.current.scrollBy({
      left: direction === 'next' ? scrollAmount : -scrollAmount,
      behavior: 'smooth'
    });
  }, [equipmentRowsRef, isMonthView]);

  const navigateDays = useCallback((direction: 'prev' | 'next') => {
    if (!equipmentRowsRef.current) return;
    
    const daysToMove = isMonthView ? 7 : 1;
    const dayWidth = 50;
    const scrollAmount = dayWidth * daysToMove;
    
    equipmentRowsRef.current.scrollBy({
      left: direction === 'next' ? scrollAmount : -scrollAmount,
      behavior: 'smooth'
    });
  }, [equipmentRowsRef, isMonthView]);

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
    handleEquipmentScroll, // Single master scroll handler
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    navigatePeriod,
    navigateDays,
  };
}