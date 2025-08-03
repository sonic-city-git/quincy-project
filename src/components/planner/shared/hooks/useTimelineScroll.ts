import { RefObject, useCallback, useEffect, useRef, useMemo } from 'react';
import { useScrollStateMachine, type ScrollOperation } from './useScrollStateMachine';
import { LAYOUT } from '../constants';

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
  scrollCoordinator, // Use scroll state machine
}: UseTimelineScrollProps & { scrollCoordinator?: ReturnType<typeof useScrollStateMachine> }) {
  
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

  // STATE MACHINE: Mouse drag handlers with proper coordination
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!equipmentRowsRef.current) return;
    
    // Start drag operation in state machine
    if (scrollCoordinator?.startOperation('dragging')) {
      setIsDragging(true);
      setDragStart({
        x: e.pageX - equipmentRowsRef.current.offsetLeft,
        scrollLeft: equipmentRowsRef.current.scrollLeft,
      });
    }
  }, [equipmentRowsRef, setIsDragging, setDragStart, scrollCoordinator]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !equipmentRowsRef.current) return;
    e.preventDefault();
    
    // Use requestAnimationFrame to throttle mouse move updates for smooth dragging
    requestAnimationFrame(() => {
      if (!equipmentRowsRef.current || !isDragging) return;
      
      // STATE MACHINE: Only execute if dragging operation is active
      if (scrollCoordinator?.isOperationActive('dragging')) {
        const x = e.pageX - equipmentRowsRef.current.offsetLeft;
        const walk = (x - dragStart.x) * 2;
        const newScrollLeft = dragStart.scrollLeft - walk;
        
        // Use state machine for coordinated manual scroll
        scrollCoordinator.executeManual(equipmentRowsRef.current, newScrollLeft);
      }
    });
  }, [isDragging, equipmentRowsRef, dragStart, scrollCoordinator]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    // End drag operation in state machine
    scrollCoordinator?.endOperation('dragging');
  }, [setIsDragging, scrollCoordinator]);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
    // End drag operation in state machine
    scrollCoordinator?.endOperation('dragging');
  }, [setIsDragging, scrollCoordinator]);

  // STATE MACHINE: Navigation functions with proper coordination
  const navigatePeriod = useCallback((direction: 'prev' | 'next') => {
    if (!equipmentRowsRef.current) return;
    
    const daysToMove = isMonthView ? 30 : 7;
    const dayWidth = LAYOUT.DAY_CELL_WIDTH;
    const scrollAmount = dayWidth * daysToMove;
    const currentScroll = equipmentRowsRef.current.scrollLeft;
    const targetScroll = direction === 'next' ? 
      currentScroll + scrollAmount : currentScroll - scrollAmount;
    
    // Use state machine for coordinated smooth navigation
    if (scrollCoordinator?.startOperation('navigating', 500)) {
      scrollCoordinator.executeSmooth(equipmentRowsRef.current, Math.max(0, targetScroll));
    }
  }, [equipmentRowsRef, isMonthView, scrollCoordinator]);

  const navigateDays = useCallback((direction: 'prev' | 'next') => {
    if (!equipmentRowsRef.current) return;
    
    const daysToMove = isMonthView ? 7 : 1;
    const dayWidth = LAYOUT.DAY_CELL_WIDTH;
    const scrollAmount = dayWidth * daysToMove;
    const currentScroll = equipmentRowsRef.current.scrollLeft;
    const targetScroll = direction === 'next' ? 
      currentScroll + scrollAmount : currentScroll - scrollAmount;
    
    // Use state machine for coordinated smooth navigation
    if (scrollCoordinator?.startOperation('navigating', 500)) {
      scrollCoordinator.executeSmooth(equipmentRowsRef.current, Math.max(0, targetScroll));
    }
  }, [equipmentRowsRef, isMonthView, scrollCoordinator]);

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