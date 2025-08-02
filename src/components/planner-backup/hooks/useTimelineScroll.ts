import { RefObject, useCallback, useEffect, useRef, useMemo } from 'react';

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

  // More responsive infinite scroll handler
  const handleEquipmentScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const { scrollLeft, scrollWidth, clientWidth } = element;
    
    // Reduced debounce for better responsiveness
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      // Predictive data fetching strategy:
      // - Trigger expansion when user is within 1000px (20 days) of edge
      // - This gives time for data to load before user actually reaches the end
      // - Each expansion adds 35 days (5 weeks) of buffer in that direction
      const dataFetchThreshold = 1000; // Start prefetching when within 20 days of edge
      
      const startDataThreshold = dataFetchThreshold;
      const endDataThreshold = scrollWidth - clientWidth - dataFetchThreshold;
      
      // Predictive data fetching (loads data well before user reaches edge)
      if (scrollLeft < startDataThreshold || scrollLeft > endDataThreshold) {
        const direction = scrollLeft < startDataThreshold ? 'start' : 'end';
        loadMoreDates(direction);
      }
    }, 50); // Very responsive for early prefetching
  }, [loadMoreDates]);

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

  // Memoize the returned object to prevent unnecessary re-renders of components using these handlers
  return useMemo(() => ({
    handleEquipmentScroll, // Single master scroll handler
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    navigatePeriod,
    navigateDays,
  }), [loadMoreDates]); // Simplified dependencies - only track core dependencies
}