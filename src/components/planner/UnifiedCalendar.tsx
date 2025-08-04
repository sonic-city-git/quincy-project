import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Skeleton } from "../ui/skeleton";
import { format } from "date-fns";

// Option to test unified system
import { useTimelineHub } from './shared/hooks/useTimelineHub';


import { LAYOUT, PERFORMANCE } from './shared/constants';

// Shared timeline components
import { PlannerFilters, TimelineHeader } from './shared/components/TimelineHeader';
import { TimelineContent } from './shared/components/TimelineContent';
import { useSimpleInfiniteScroll as useTimelineScroll } from './shared/hooks/useSimpleInfiniteScroll';

interface UnifiedCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedOwner?: string;
  resourceType: 'equipment' | 'crew';
  onTabChange?: (tab: 'equipment' | 'crew') => void;
  filters?: PlannerFilters;
  onFiltersChange?: (filters: PlannerFilters) => void;
  showProblemsOnly?: boolean;
  onToggleProblemsOnly?: () => void;
  targetScrollItem?: {
    type: 'equipment' | 'crew';
    id: string;
  } | null;
  isWithinScrollContainer?: boolean;
  renderOnlyLeft?: boolean;
  renderOnlyTimeline?: boolean;
}

  // Performance metrics interface for potential future monitoring

/**
 * UnifiedCalendar - Clean Architecture Implementation
 * 
 * A unified resource planner that supports both equipment and crew scheduling
 * with type-safe interfaces and performance optimizations.
 * 
 * Key improvements:
 * - Conditional data loading (only active resource type)
 * - Proper generic typing (no forced equipment/crew compatibility)
 * - Performance monitoring capabilities
 * - Clean separation of concerns
 */
export function UnifiedCalendar({ 
  selectedDate, 
  onDateChange, 
  selectedOwner,
  resourceType,
  onTabChange,
  filters,
  onFiltersChange,
  showProblemsOnly = false,
  onToggleProblemsOnly,
  targetScrollItem,
  isWithinScrollContainer = false,
  renderOnlyLeft = false,
  renderOnlyTimeline = false
}: UnifiedCalendarProps) {
  
  // Performance tracking
  const loadStartTime = useRef(performance.now());
  const renderStartTime = useRef(performance.now());
  
  // Remove excessive logging for better performance
  // console.log('UnifiedCalendar render', { selectedDate: selectedDate.toISOString() });

  // SIMPLIFIED: Use single consolidated scroll hook
  const timelineScroll = useTimelineScroll({ selectedDate });
  
  const {
    timelineStart,
    timelineEnd,
    timelineDates,
    formattedDates,
    virtualTimeline,
    containerWidth,
    updateContainerWidth,
    scrollPosition,
    equipmentRowsRef,
    stickyHeadersRef,
    scrollToDate,
    isDragging,
    handleScroll,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
  } = timelineScroll;

  // UNIFIED: All scroll handling is now in the unified hook - no need for separate scroll handlers!

  // Note: Header scroll is now handled in Planner.tsx

  // SIMPLIFIED: Use timeline range directly (no racing conditions)
  const stableDataRange = useMemo(() => ({
    start: timelineStart,
    end: timelineEnd
  }), [timelineStart?.getTime(), timelineEnd?.getTime()]); // Use timestamps for more stable dependencies

  // Calculate month sections for the header
  const monthSections = useMemo(() => {
    if (!formattedDates.length) return [];
    
    const sections: Array<{
      date: Date;
      monthYear: string;
      width: number;
      startIndex: number;
      endIndex: number;
      isEven: boolean;
    }> = [];
    
    let currentMonth = -1;
    let currentYear = -1;
    let startIndex = 0;
    let sectionCount = 0;
    
    formattedDates.forEach((dateInfo, index) => {
      const month = dateInfo.date.getMonth();
      const year = dateInfo.date.getFullYear();
      
      if (month !== currentMonth || year !== currentYear) {
        // Finish previous section
        if (currentMonth !== -1) {
          const endIndex = index - 1;
          const width = (endIndex - startIndex + 1) * LAYOUT.DAY_CELL_WIDTH;
          sections.push({
            date: formattedDates[startIndex].date,
            monthYear: `${currentYear}-${currentMonth}`,
            width,
            startIndex,
            endIndex,
            isEven: sectionCount % 2 === 0
          });
          sectionCount++;
        }
        
        // Start new section
        currentMonth = month;
        currentYear = year;
        startIndex = index;
      }
    });
    
    // Add final section
    if (currentMonth !== -1) {
      const endIndex = formattedDates.length - 1;
      const width = (endIndex - startIndex + 1) * LAYOUT.DAY_CELL_WIDTH;
      sections.push({
        date: formattedDates[startIndex].date,
        monthYear: `${currentYear}-${currentMonth}`,
        width,
        startIndex,
        endIndex,
        isEven: sectionCount % 2 === 0
      });
    }
    
    return sections;
  }, [formattedDates]);

  // SINGLE HUB FOR EVERYTHING
  const currentHub = useTimelineHub({
    resourceType,
    periodStart: stableDataRange.start,
    periodEnd: stableDataRange.end,
    selectedOwner,
    visibleTimelineStart: timelineStart,
    visibleTimelineEnd: timelineEnd,
    enabled: true
  });
  
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
    getCrewRoleForDate,
    getLowestAvailable,
    toggleGroup,
    toggleEquipmentExpansion,
    updateBookingState,
    getBookingState,
    batchUpdateBookings,
    clearStaleStates,
    resolveConflict,
  } = currentHub;

  // REMOVED: Performance metrics logging to reduce console spam

  // Delay stale state cleanup to avoid interfering with initial scroll
  useEffect(() => {
    const timer = setTimeout(() => {
      clearStaleStates();
    }, 5000); // Wait 5 seconds after mount before starting cleanup
    return () => clearTimeout(timer);
  }, []);

  // Handle scrolling to target item when targetScrollItem is provided
  useEffect(() => {
    if (targetScrollItem && targetScrollItem.type === resourceType && equipmentGroups.length > 0) {
      const timer = setTimeout(() => {
        try {
          const targetElement = document.querySelector(`[data-resource-id="${targetScrollItem.id}"]`);
          
          if (targetElement && equipmentRowsRef.current) {
            targetElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest'
            });
          } else {
            // TODO: Implement proper error handling for scroll target not found
          }
        } catch (error) {
          // TODO: Implement proper error handling for scroll errors
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [targetScrollItem, resourceType, equipmentGroups, equipmentRowsRef]);

  // Simple loading state
  const shouldShowLoading = !isEquipmentReady;
  
  // Cleanup stale states periodically (but delay initial cleanup to avoid scroll artifacts)
  const clearStaleStatesRef = useRef(clearStaleStates);
  clearStaleStatesRef.current = clearStaleStates;
  
  useEffect(() => {
    // Delay first cleanup to avoid interfering with initial load and scroll positioning
    const initialDelay = setTimeout(() => {
      const interval = setInterval(() => {
        clearStaleStatesRef.current();
      }, PERFORMANCE.CACHE_CLEANUP_INTERVAL);

      return () => clearInterval(interval);
    }, 10000); // Wait 10 seconds before starting cleanup cycle

    return () => clearTimeout(initialDelay);
  }, []);

  // Note: formattedDates and monthSections are now provided by useSharedTimeline

  // Resource-agnostic booking lookup with proper typing
  const getBookingsForResource = useCallback((resourceId: string, dateStr: string, resource: any) => {
    const booking = getBookingForEquipment(resourceId, dateStr);
    if (!booking) return undefined;
    
    // Return a standardized interface that works for both resource types
    return {
      resourceId: booking.equipmentId || booking.crewMemberId || resourceId,
      resourceName: booking.equipmentName || booking.crewMemberName || resource?.name,
      capacity: resourceType === 'crew' ? 1 : (booking.stock || resource?.stock || 1),
      date: booking.date,
      folder: booking.folderPath || booking.department || resource?.folder,
      assignments: booking.bookings || booking.assignments || [],
      totalUsed: booking.totalUsed || booking.totalAssignments || 0,
      isOverbooked: booking.isOverbooked || false,
      resourceType,
    };
  }, [getBookingForEquipment, resourceType]);

  // Optimized availability calculation - only depends on date range, not selection
  const dateStrings = useMemo(() => formattedDates.map(d => d.dateStr), [
    formattedDates.length, 
    formattedDates[0]?.dateStr, 
    formattedDates[formattedDates.length - 1]?.dateStr
  ]); // Only recalculate when date range changes, not when selection changes
  
  const getAvailableCapacityForResource = useCallback((resourceId: string) => {
    return getLowestAvailable(resourceId, dateStrings);
  }, [getLowestAvailable, dateStrings]);

  if (shouldShowLoading) {
    return (
      <div className="border border-border rounded-lg overflow-hidden bg-background">
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 text-lg font-medium">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
              Loading {resourceType} timeline...
            </div>
            <p className="text-sm text-muted-foreground">
              Loading booking data and availability...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Return TimelineHeader (sticky) and TimelineContent (scrollable) 
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background">
      {/* Fixed Page Header with filters/tabs */}
      <TimelineHeader
        formattedDates={formattedDates}
        virtualTimeline={virtualTimeline}
        monthSections={monthSections}
        onDateChange={onDateChange}
        timelineScroll={{
          handleScroll,
          scrollPosition,
          isDragging
        }}
        stickyHeadersRef={stickyHeadersRef}
        resourceType={resourceType}
        activeTab={resourceType}
        onTabChange={onTabChange}
        filters={filters}
        onFiltersChange={onFiltersChange}
        showProblemsOnly={showProblemsOnly}
        onToggleProblemsOnly={onToggleProblemsOnly}
      />
      
      {/* Scrollable content area with proper height constraint */}
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 290px)' }}>
        <TimelineContent
        equipmentGroups={equipmentGroups}
        expandedGroups={expandedGroups}
        expandedEquipment={expandedEquipment}
        equipmentProjectUsage={equipmentProjectUsage}
        toggleGroup={toggleGroup}
        toggleEquipmentExpansion={toggleEquipmentExpansion}
        formattedDates={formattedDates}
        virtualTimeline={virtualTimeline}
        getBookingForEquipment={getBookingForEquipment}
        getProjectQuantityForDate={getProjectQuantityForDate}
        getCrewRoleForDate={getCrewRoleForDate}
        equipmentRowsRef={equipmentRowsRef}
        handleTimelineScroll={handleScroll}
        handleTimelineMouseMove={handleMouseMove}
        handleMouseDown={handleMouseDown}
        handleMouseUp={handleMouseUp}
        handleMouseLeave={handleMouseLeave}
        isDragging={isDragging}
        getBookingsForEquipment={getBookingsForResource}
        getBookingState={getBookingState}
        updateBookingState={updateBookingState}
        getLowestAvailable={getAvailableCapacityForResource}
        resourceType={resourceType}
        filters={filters}
        showProblemsOnly={showProblemsOnly}
        visibleTimelineStart={timelineStart}
        visibleTimelineEnd={timelineEnd}
        isWithinScrollContainer={isWithinScrollContainer}
      />
      
      {/* Simple debug info for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg font-mono text-xs z-50 max-w-sm">
          <div className="text-green-400 font-bold mb-2">🎯 Simple Infinite Scroll</div>
          
          <div className="mb-3">
            <div className="text-blue-400 font-semibold">Timeline:</div>
            <div>Total Days: {formattedDates.length}</div>
            <div>Scroll Position: {scrollPosition.toFixed(0)}px</div>
            <div>Container: {containerWidth}px</div>
          </div>
          
          <div className="text-xs text-gray-400">
            Clean infinite scroll without complexity
          </div>
        </div>
      )}
      </div>
    </div>
  );
}