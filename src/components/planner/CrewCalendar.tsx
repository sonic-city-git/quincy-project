import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { format, isWeekend, isSameDay } from "date-fns";
import { Skeleton } from "../ui/skeleton";

import { useCrewTimeline } from './shared/hooks/useCrewTimeline';
import { useCrewHub } from './shared/hooks/useCrewHub';
import { useTimelineScroll } from './shared/hooks/useTimelineScroll';
import { LAYOUT, PERFORMANCE } from './shared/constants';

// Shared timeline components
import { TimelineHeader } from './shared/components/TimelineHeader';
import { TimelineContent } from './shared/components/TimelineContent';



interface CrewCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedOwner?: string;
  viewMode?: 'week' | 'month';
}

export function CrewCalendar({ selectedDate, onDateChange, selectedOwner, viewMode = 'week' }: CrewCalendarProps) {
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
    scrollToDate,
  } = useCrewTimeline({ selectedDate });

  const scrollHandlers = useTimelineScroll({
    equipmentRowsRef,
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
    loadMoreDates,
    isMonthView,
  });

  // Simple: scroll to today on page load, animate to selected date when it changes
  useEffect(() => {
    // On page load, scroll to today instantly (no animation)
    const today = new Date();
    setTimeout(() => scrollToDate(today, false), 300); // false = no animation
  }, []); // Only on mount
  
  // Track the last selected date to prevent unnecessary animations
  const lastSelectedDateRef = useRef<string>('');
  
  useEffect(() => {
    // When date selection changes, animate to it smoothly
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    
    // Only animate if the date actually changed (prevent automatic triggers)
    if (selectedDateStr !== lastSelectedDateRef.current) {
      lastSelectedDateRef.current = selectedDateStr;
      scrollToDate(selectedDate, true); // true = animate
    }
  }, [selectedDate, scrollToDate]);

  // Enhanced scroll handler to sync headers with timeline content
  const handleTimelineScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    // Handle infinite scroll and drag functionality
    scrollHandlers.handleEquipmentScroll(e);
    
    // Sync timeline headers with content scroll position
    const scrollLeft = e.currentTarget.scrollLeft;
    if (stickyHeadersRef.current) {
      stickyHeadersRef.current.scrollLeft = scrollLeft;
    }
  }, [scrollHandlers]);

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

  // Immediate data range updates for responsive highlighting
  // Only debounce during rapid timeline expansion, not during date selection
  const [stableDataRange, setStableDataRange] = useState({
    start: timelineStart,
    end: timelineEnd
  });
  
  const lastTimelineChangeRef = useRef(Date.now());
  
  useEffect(() => {
    const now = Date.now();
    const timeSinceLastChange = now - lastTimelineChangeRef.current;
    lastTimelineChangeRef.current = now;
    
    // If timeline changed recently (< 100ms), it's likely rapid expansion - debounce it
    // Otherwise, update immediately for responsive date selection
    if (timeSinceLastChange < 100) {
      const debounceTimer = setTimeout(() => {
        setStableDataRange({
          start: timelineStart,
          end: timelineEnd
        });
      }, 50);
      return () => clearTimeout(debounceTimer);
    } else {
      // Immediate update for single date changes
      setStableDataRange({
        start: timelineStart,
        end: timelineEnd
      });
    }
  }, [timelineStart, timelineEnd]);

  // Use unified crew hub with all data services
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
  } = useCrewHub({
    periodStart: stableDataRange.start,
    periodEnd: stableDataRange.end,
    selectedOwner,
  });

  // More sophisticated loading state management
  // Show skeleton only when we have no crew data at all
  // If crew is ready but assignments are loading, show crew with loading indicators
  const [hasInitialData, setHasInitialData] = useState(false);
  
  useEffect(() => {
    if (equipmentGroups.length > 0 && !hasInitialData) { // equipmentGroups contains crew groups
      setHasInitialData(true);
    }
  }, [equipmentGroups.length, hasInitialData]);

  // Only show skeleton loading when we have absolutely no data
  const shouldShowLoading = !isEquipmentReady && !hasInitialData;
  
  // Granular booking state now integrated into useEquipmentHub

  // Cleanup stale booking states periodically - use ref to avoid dependency on clearStaleStates
  const clearStaleStatesRef = useRef(clearStaleStates);
  clearStaleStatesRef.current = clearStaleStates;
  
  useEffect(() => {
    const interval = setInterval(() => {
      clearStaleStatesRef.current();
    }, PERFORMANCE.CACHE_CLEANUP_INTERVAL);

    return () => clearInterval(interval);
  }, []); // No dependencies - interval runs for component lifetime





  // Pre-format dates for performance - avoid repeated format() calls
  const baseDates = useMemo(() => {
    return timelineDates.map(date => ({
      date,
      dateStr: format(date, 'yyyy-MM-dd'),
      isoString: date.toISOString(),
      isWeekendDay: isWeekend(date),
      monthYear: format(date, 'yyyy-MM')
    }));
  }, [timelineDates]); // Use timelineDates directly as dependency

  const formattedDates = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    
    return baseDates.map(baseDate => ({
      ...baseDate,
      isToday: baseDate.dateStr === todayStr,
      isSelected: baseDate.dateStr === selectedDateStr
    }));
  }, [baseDates, selectedDate]);

  // Month sections with alternating backgrounds - enhanced for year transitions
  const monthSections = useMemo(() => {
    const sections = [];
    let currentSection = null;
    
    baseDates.forEach((dateInfo, index) => {
      if (!currentSection || currentSection.monthYear !== dateInfo.monthYear) {
        // Finish previous section
        if (currentSection) {
          currentSection.endIndex = index - 1;
          currentSection.width = (currentSection.endIndex - currentSection.startIndex + 1) * 50;
          sections.push(currentSection);
        }
        
        // Check if this is a new year for enhanced styling
        const isNewYear = sections.length > 0 && 
          dateInfo.date.getFullYear() !== sections[sections.length - 1].date.getFullYear();
        
        // Start new section
        currentSection = {
          monthYear: dateInfo.monthYear,
          date: dateInfo.date,
          startIndex: index,
          endIndex: index,
          width: 0,
          isEven: sections.length % 2 === 0,
          isNewYear
        };
      }
    });
    
    // Don't forget the last section
    if (currentSection) {
      currentSection.endIndex = baseDates.length - 1;
      currentSection.width = (currentSection.endIndex - currentSection.startIndex + 1) * 50;
      sections.push(currentSection);
    }
    
    return sections;
  }, [baseDates]);

  // Simple assignment lookup - let React Query handle updates naturally  
  const getBookingsForEquipment = useCallback((crewMemberId: string, dateStr: string, crewMember: any) => {
    const assignment = getBookingForEquipment(crewMemberId, dateStr);
    if (!assignment) return undefined;
    
    return {
      equipment_id: assignment.crewMemberId, // Using equipment interface for compatibility
      equipment_name: assignment.crewMemberName,
      stock: 1, // Crew members have availability, not stock
      date: assignment.date,
      folder_name: assignment.department,
      bookings: assignment.assignments,
      total_used: assignment.totalAssignments,
      is_overbooked: assignment.isOverbooked,
    };
  }, [getBookingForEquipment]); // Update when underlying function changes

  // Optimized crew availability calculation - memoize date strings from stable baseDates
  const dateStrings = useMemo(() => baseDates.map(d => d.dateStr), [baseDates]);
  
  const getLowestAvailableForEquipment = useCallback((crewMemberId: string) => {
    return getLowestAvailable(crewMemberId, dateStrings);
  }, [dateStrings]); // dateStrings dependency needed, but getLowestAvailable is stable

  if (shouldShowLoading) {
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
      <TimelineHeader
        formattedDates={formattedDates}
        monthSections={monthSections}
        onDateChange={onDateChange}
        onHeaderScroll={handleHeaderScroll}
        stickyHeadersRef={stickyHeadersRef}
      />

      <TimelineContent
        equipmentGroups={equipmentGroups}
        expandedGroups={expandedGroups}
        expandedEquipment={expandedEquipment}
        equipmentProjectUsage={equipmentProjectUsage}
        toggleGroup={toggleGroup}
        toggleEquipmentExpansion={toggleEquipmentExpansion}
        formattedDates={formattedDates}
        getBookingForEquipment={getBookingForEquipment}
        getProjectQuantityForDate={getProjectQuantityForDate}
        equipmentRowsRef={equipmentRowsRef}
        handleTimelineScroll={handleTimelineScroll}
        handleTimelineMouseMove={handleTimelineMouseMove}
        scrollHandlers={scrollHandlers}
        isDragging={isDragging}
        getBookingsForEquipment={getBookingsForEquipment}
        getBookingState={getBookingState}
        updateBookingState={updateBookingState}
        getLowestAvailable={getLowestAvailableForEquipment}
        resourceType="crew"
      />
          </div>
  );
}