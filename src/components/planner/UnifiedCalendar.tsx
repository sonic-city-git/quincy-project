import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { format, isWeekend, isSameDay } from "date-fns";
import { Skeleton } from "../ui/skeleton";

import { useEquipmentHub } from './shared/hooks/useEquipmentHub';
import { useCrewHub } from './shared/hooks/useCrewHub';
import { useTimelineScroll } from './shared/hooks/useTimelineScroll';
import { LAYOUT, PERFORMANCE } from './shared/constants';

// Shared timeline components
import { TimelineHeader } from './shared/components/TimelineHeader';
import { TimelineContent } from './shared/components/TimelineContent';
import { SharedTimeline } from './shared/types/timeline';

interface UnifiedCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedOwner?: string;
  viewMode?: 'week' | 'month';
  activeTab?: 'equipment' | 'crew';
  onTabChange?: (tab: 'equipment' | 'crew') => void;
  sharedTimeline: SharedTimeline;
  resourceType: 'equipment' | 'crew';
}

export function UnifiedCalendar({ 
  selectedDate, 
  onDateChange, 
  selectedOwner, 
  viewMode = 'week', 
  activeTab, 
  onTabChange, 
  sharedTimeline,
  resourceType 
}: UnifiedCalendarProps) {
  const isMonthView = viewMode === 'month';
  
  // Ref for timeline header sync
  const stickyHeadersRef = useRef<HTMLDivElement>(null);
  
  // Use shared timeline state
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
  } = sharedTimeline;

  const scrollHandlers = useTimelineScroll({
    equipmentRowsRef,
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
    loadMoreDates,
    isMonthView,
  });

  // Note: Scroll logic is now simple - just scroll to center selected date

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

  // Always call both hooks to avoid violating Rules of Hooks
  const equipmentHub = useEquipmentHub({
    periodStart: stableDataRange.start,
    periodEnd: stableDataRange.end,
    selectedOwner,
  });
  
  const crewHub = useCrewHub({
    periodStart: stableDataRange.start,
    periodEnd: stableDataRange.end,
    selectedOwner,
  });
  
  // Use the appropriate hub data based on resource type
  const currentHub = resourceType === 'equipment' ? equipmentHub : crewHub;
  
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
  } = currentHub;

  // More sophisticated loading state management
  // Show skeleton only when we have no data at all
  const [hasInitialData, setHasInitialData] = useState(false);
  
  useEffect(() => {
    if (equipmentGroups.length > 0 && !hasInitialData) {
      setHasInitialData(true);
    }
  }, [equipmentGroups.length, hasInitialData]);

  // Only show skeleton loading when we have absolutely no data
  const shouldShowLoading = !isEquipmentReady && !hasInitialData;
  
  // Cleanup stale states periodically
  const clearStaleStatesRef = useRef(clearStaleStates);
  clearStaleStatesRef.current = clearStaleStates;
  
  useEffect(() => {
    const interval = setInterval(() => {
      clearStaleStatesRef.current();
    }, PERFORMANCE.CACHE_CLEANUP_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Pre-format dates for performance - avoid repeated format() calls
  const baseDates = useMemo(() => {
    return timelineDates.map(date => ({
      date,
      dateStr: format(date, 'yyyy-MM-dd'),
      isoString: date.toISOString(),
      isWeekendDay: isWeekend(date),
      monthYear: format(date, 'yyyy-MM')
    }));
  }, [timelineDates]);

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

  // Resource-specific booking lookup
  const getBookingsForEquipment = useCallback((resourceId: string, dateStr: string, resource: any) => {
    const booking = getBookingForEquipment(resourceId, dateStr);
    if (!booking) return undefined;
    
    if (resourceType === 'crew') {
      // Crew-specific mapping
      return {
        equipment_id: booking.crewMemberId || booking.equipmentId,
        equipment_name: booking.crewMemberName || booking.equipmentName,
        stock: 1, // Crew members have availability, not stock
        date: booking.date,
        folder_name: booking.department || booking.folderPath,
        bookings: booking.assignments || booking.bookings,
        total_used: booking.totalAssignments || booking.totalUsed,
        is_overbooked: booking.isOverbooked,
      };
    } else {
      // Equipment-specific mapping
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
    }
  }, [getBookingForEquipment, resourceType]);

  // Optimized availability calculation
  const dateStrings = useMemo(() => baseDates.map(d => d.dateStr), [baseDates]);
  
  const getLowestAvailableForEquipment = useCallback((resourceId: string) => {
    return getLowestAvailable(resourceId, dateStrings);
  }, [getLowestAvailable, dateStrings]);

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
        resourceType={resourceType}
        activeTab={activeTab}
        onTabChange={onTabChange}
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
        resourceType={resourceType}
      />
    </div>
  );
}