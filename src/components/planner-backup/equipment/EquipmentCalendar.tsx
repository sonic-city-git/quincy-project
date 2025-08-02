import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { format, isWeekend } from "date-fns";
import { Skeleton } from "../../ui/skeleton";

// Equipment-specific hooks
import { useEquipmentTimeline } from './hooks/useEquipmentTimeline';
import { useEquipmentHub } from './hooks/useEquipmentHub';

// Shared timeline components and utilities
import { useTimelineScroll } from '../shared/hooks/useTimelineScroll';
import { TimelineHeader } from '../shared/components/TimelineHeader';
import { TimelineContent } from '../shared/components/TimelineContent';
import { LAYOUT, PERFORMANCE } from '../shared/constants';

interface EquipmentCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedOwner?: string;
  viewMode?: 'week' | 'month';
}

export function EquipmentCalendar({ 
  selectedDate, 
  onDateChange, 
  selectedOwner, 
  viewMode = 'week' 
}: EquipmentCalendarProps) {
  console.log('🔧 EquipmentCalendar rendering');
  const isMonthView = viewMode === 'month';
  
  // Ref for timeline header sync
  const stickyHeadersRef = useRef<HTMLDivElement>(null);
  
  // Equipment-specific timeline logic
  const {
    timelineStart,
    timelineEnd,
    timelineDates,
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
    equipmentRowsRef,
    loadMoreDates,
    scrollToDate,
  } = useEquipmentTimeline({ selectedDate });

  // Shared scroll handling
  const scrollHandlers = useTimelineScroll({
    equipmentRowsRef,
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
    loadMoreDates,
    isMonthView,
  });

  // Scroll to today on mount, animate to selected date on changes
  useEffect(() => {
    const today = new Date();
    setTimeout(() => scrollToDate(today, false), 300);
  }, []);
  
  const lastSelectedDateRef = useRef<string>('');
  
  useEffect(() => {
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    if (selectedDateStr !== lastSelectedDateRef.current) {
      lastSelectedDateRef.current = selectedDateStr;
      scrollToDate(selectedDate, true);
    }
  }, [selectedDate, scrollToDate]);

  // Enhanced scroll handler to sync headers
  const handleTimelineScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    scrollHandlers.handleEquipmentScroll(e);
    const scrollLeft = e.currentTarget.scrollLeft;
    if (stickyHeadersRef.current) {
      stickyHeadersRef.current.scrollLeft = scrollLeft;
    }
  }, [scrollHandlers]);

  // Enhanced mouse move handler for drag synchronization
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    scrollHandlers.handleMouseMove(e);
    if (isDragging && equipmentRowsRef.current && stickyHeadersRef.current) {
      stickyHeadersRef.current.scrollLeft = equipmentRowsRef.current.scrollLeft;
    }
  }, [scrollHandlers, isDragging, equipmentRowsRef]);

  // Stable data range for equipment hub
  const stableDataRange = useMemo(() => {
    return { start: timelineStart, end: timelineEnd };
  }, [timelineStart, timelineEnd]);

  // Equipment-specific data management
  const {
    equipmentGroups,
    equipmentById,
    bookingsData,
    conflicts,
    expandedGroups,
    expandedEquipment,
    equipmentProjectUsage,
    isLoading,
    isEquipmentReady,
    isBookingsReady,
    resolutionInProgress,
    getBookingForEquipment,
    getProjectQuantityForDate,
    getLowestAvailable,
    toggleGroup,
    toggleEquipmentExpansion,
    updateBookingState,
    getBookingState,
    batchUpdateBookings,
    clearStaleStates,
    resolveConflict,
  } = useEquipmentHub({
    periodStart: stableDataRange.start,
    periodEnd: stableDataRange.end,
    selectedOwner,
  });

  // Loading state management
  const [hasInitialData, setHasInitialData] = useState(false);
  
  useEffect(() => {
    if (equipmentGroups.length > 0 && !hasInitialData) {
      setHasInitialData(true);
    }
  }, [equipmentGroups.length, hasInitialData]);

  const shouldShowLoading = !isEquipmentReady && !hasInitialData;
  
  // Cleanup stale booking states periodically
  const clearStaleStatesRef = useRef(clearStaleStates);
  clearStaleStatesRef.current = clearStaleStates;
  
  useEffect(() => {
    const interval = setInterval(() => {
      clearStaleStatesRef.current();
    }, PERFORMANCE.CACHE_CLEANUP_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Pre-format dates for performance
  const baseDates = useMemo(() => {
    return timelineDates
      .filter(date => date && date instanceof Date && !isNaN(date.getTime()))
      .map(date => ({
        date,
        dateStr: format(date, 'yyyy-MM-dd'),
        isoString: date.toISOString(),
        isWeekendDay: isWeekend(date),
        monthYear: format(date, 'yyyy-MM')
      }));
  }, [timelineDates]);

  const formattedDates = useMemo(() => {
    return baseDates;
  }, [baseDates]);

  // Month sections for calendar headers
  const monthSections = useMemo(() => {
    const sections: Array<{ 
      date: Date; 
      monthYear: string; 
      dayCount: number; 
      startIndex: number;
      width: number;
      isEven: boolean;
    }> = [];
    let currentMonth = '';
    let dayCount = 0;
    let startIndex = 0;

    formattedDates.forEach((dateInfo, index) => {
      const monthYear = dateInfo.monthYear;
      
      if (monthYear !== currentMonth) {
        if (currentMonth) {
          sections.push({ 
            date: formattedDates[startIndex].date,
            monthYear: currentMonth,
            dayCount, 
            startIndex,
            width: dayCount * LAYOUT.DAY_CELL_WIDTH,
            isEven: sections.length % 2 === 0
          });
        }
        currentMonth = monthYear;
        dayCount = 1;
        startIndex = index;
      } else {
        dayCount++;
      }
    });

    if (currentMonth && formattedDates.length > 0) {
      sections.push({ 
        date: formattedDates[startIndex].date,
        monthYear: currentMonth,
        dayCount, 
        startIndex,
        width: dayCount * LAYOUT.DAY_CELL_WIDTH,
        isEven: sections.length % 2 === 0
      });
    }

    return sections;
  }, [formattedDates]);

  if (shouldShowLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeline Header */}
      <TimelineHeader
        formattedDates={formattedDates}
        monthSections={monthSections}
        onDateChange={onDateChange}
        onHeaderScroll={handleTimelineScroll}
        stickyHeadersRef={stickyHeadersRef}
      />

      {/* Timeline Content */}
      <TimelineContent
        resourceGroups={equipmentGroups}
        expandedGroups={expandedGroups}
        expandedResources={expandedEquipment}
        resourceProjectUsage={equipmentProjectUsage}
        toggleGroup={toggleGroup}
        toggleResourceExpansion={toggleEquipmentExpansion}
        formattedDates={formattedDates}
        getBookingForResource={getBookingForEquipment}
        getProjectQuantityForDate={getProjectQuantityForDate}
        resourceRowsRef={equipmentRowsRef}
        handleTimelineScroll={handleTimelineScroll}
        handleTimelineMouseMove={handleMouseMove}
        scrollHandlers={scrollHandlers}
        isDragging={isDragging}
        getBookingsForResource={getBookingForEquipment}
        getBookingState={getBookingState}
        updateBookingState={updateBookingState}
        getLowestAvailable={getLowestAvailable}
        resourceType="equipment"
      />
    </div>
  );
}