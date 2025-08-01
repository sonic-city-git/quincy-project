import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { format, isWeekend, isSameDay } from "date-fns";
import { Skeleton } from "../ui/skeleton";

import { useEquipmentTimeline } from './hooks/useEquipmentTimeline';
import { useTimelineScroll } from './hooks/useTimelineScroll';
import { useGranularBookingState } from './hooks/useEquipmentData';
import { useOptimizedEquipmentData } from './hooks/useOptimizedEquipmentData';
import { LAYOUT, PERFORMANCE } from './constants';

// New modular components
import { EquipmentCalendarHeader } from './equipment/EquipmentCalendarHeader';
import { EquipmentCalendarContent } from './equipment/EquipmentCalendarContent';



interface EquipmentCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedOwner?: string;
  viewMode?: 'week' | 'month';
}

export function EquipmentCalendar({ selectedDate, onDateChange, selectedOwner, viewMode = 'week' }: EquipmentCalendarProps) {
  const isMonthView = viewMode === 'month';
  
  // Ref for timeline header sync
  const stickyHeadersRef = useRef<HTMLDivElement>(null);
  

  

  
  // Custom hooks
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
  } = useEquipmentTimeline({ selectedDate });

  const scrollHandlers = useTimelineScroll({
    equipmentRowsRef,
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
    loadMoreDates,
    isMonthView,
  });

  // Enhanced scroll handler to sync headers with timeline content
  const handleTimelineScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    // Handle infinite scroll and drag functionality
    scrollHandlers.handleEquipmentScroll(e);
    
    // Sync timeline headers with content scroll position
    const scrollLeft = e.currentTarget.scrollLeft;
    if (stickyHeadersRef.current) {
      stickyHeadersRef.current.scrollLeft = scrollLeft;
    }
  }, [scrollHandlers.handleEquipmentScroll]);

  // Enhanced mouse move handler for drag synchronization
  const handleTimelineMouseMove = useCallback((e: React.MouseEvent) => {
    scrollHandlers.handleMouseMove(e);
    
    // Sync headers during drag
    if (isDragging && equipmentRowsRef.current && stickyHeadersRef.current) {
      stickyHeadersRef.current.scrollLeft = equipmentRowsRef.current.scrollLeft;
    }
  }, [scrollHandlers.handleMouseMove, isDragging]);

  // Handle header scroll - sync back to timeline content (two-way sync)
  const handleHeaderScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    if (equipmentRowsRef.current) {
      equipmentRowsRef.current.scrollLeft = scrollLeft;
    }
  }, []);

  // Use optimized data hook
  const {
    equipmentGroups,
    equipmentById,
    bookingsData,
    expandedGroups,
    isLoading,
    getBookingForEquipment,
    getLowestAvailable,
    toggleGroup,
  } = useOptimizedEquipmentData({
    periodStart: timelineStart,
    periodEnd: timelineEnd,
    selectedOwner,
  });
  
  // Granular booking state management for optimistic updates
  const { updateBookingState, getBookingState, batchUpdateBookings, clearStaleStates } = useGranularBookingState();

  // Cleanup stale booking states periodically
  useEffect(() => {
    const interval = setInterval(() => {
      clearStaleStates();
    }, PERFORMANCE.CACHE_CLEANUP_INTERVAL);

    return () => clearInterval(interval);
  }, [clearStaleStates]);





  // Pre-format dates for performance - avoid repeated format() calls
  const formattedDates = useMemo(() => {
    return timelineDates.map(date => ({
      date,
      dateStr: format(date, 'yyyy-MM-dd'),
      isoString: date.toISOString(),
      isWeekendDay: isWeekend(date),
      isSelected: isSameDay(date, selectedDate),
      monthYear: format(date, 'yyyy-MM')
    }));
  }, [timelineDates, selectedDate]);

  // Month sections with alternating backgrounds  
  const monthSections = useMemo(() => {
    const sections = [];
    let currentSection = null;
    
    formattedDates.forEach((dateInfo, index) => {
      if (!currentSection || currentSection.monthYear !== dateInfo.monthYear) {
        // Finish previous section
        if (currentSection) {
          currentSection.endIndex = index - 1;
          currentSection.width = (currentSection.endIndex - currentSection.startIndex + 1) * 50;
          sections.push(currentSection);
        }
        
        // Start new section
        currentSection = {
          monthYear: dateInfo.monthYear,
          date: dateInfo.date,
          startIndex: index,
          endIndex: index,
          width: 0,
          isEven: sections.length % 2 === 0
        };
      }
    });
    
    // Don't forget the last section
    if (currentSection) {
      currentSection.endIndex = formattedDates.length - 1;
      currentSection.width = (currentSection.endIndex - currentSection.startIndex + 1) * 50;
      sections.push(currentSection);
    }
    
    return sections;
  }, [formattedDates]);

  // Optimized booking lookup function using new data structure
  const getBookingsForEquipment = useCallback((equipmentId: string, dateStr: string, equipment: any) => {
    const booking = getBookingForEquipment(equipmentId, dateStr);
    if (!booking) return undefined;
    
    return {
      equipment_id: booking.equipmentId,
      equipment_name: booking.equipmentName,
      stock: booking.stock,
      date: booking.date,
      folder_name: booking.folderPath,
      bookings: booking.bookings,
      total_used: booking.totalUsed,
      is_overbooked: booking.isOverbooked,
    };
  }, [getBookingForEquipment]);

  // Optimized lowest available calculation
  const getLowestAvailableForEquipment = useCallback((equipmentId: string) => {
    const dates = formattedDates.map(d => d.dateStr);
    return getLowestAvailable(equipmentId, dates);
  }, [getLowestAvailable, formattedDates]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <EquipmentCalendarHeader
        formattedDates={formattedDates}
        monthSections={monthSections}
        onDateChange={onDateChange}
        onHeaderScroll={handleHeaderScroll}
        stickyHeadersRef={stickyHeadersRef}
      />

      <EquipmentCalendarContent
        equipmentGroups={equipmentGroups}
        expandedGroups={expandedGroups}
        toggleGroup={toggleGroup}
        formattedDates={formattedDates}
        getBookingsForEquipment={getBookingsForEquipment}
        getBookingState={getBookingState}
        updateBookingState={updateBookingState}
        onDateChange={onDateChange}
        getLowestAvailable={getLowestAvailableForEquipment}
        equipmentRowsRef={equipmentRowsRef}
        handleTimelineScroll={handleTimelineScroll}
        handleTimelineMouseMove={handleTimelineMouseMove}
        scrollHandlers={scrollHandlers}
        isDragging={isDragging}
      />
    </div>
  );
}