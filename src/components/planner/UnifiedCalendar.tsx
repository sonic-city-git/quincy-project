import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Skeleton } from "../ui/skeleton";

import { useEquipmentHub } from './shared/hooks/useEquipmentHub';
import { useCrewHub } from './shared/hooks/useCrewHub';


import { LAYOUT, PERFORMANCE } from './shared/constants';

// Shared timeline components
import { PlannerFilters } from './shared/components/TimelineHeader';
import { TimelineContent } from './shared/components/TimelineContent';
import { useUnifiedTimelineScroll } from './shared/hooks/useUnifiedTimelineScroll';

interface UnifiedCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedOwner?: string;
  timelineScroll: ReturnType<typeof useUnifiedTimelineScroll>;
  resourceType: 'equipment' | 'crew';
  filters?: PlannerFilters;
  showProblemsOnly?: boolean;
  targetScrollItem?: {
    type: 'equipment' | 'crew';
    id: string;
  } | null;
  // NEW: Flag to indicate if content is within a unified scroll container
  isWithinScrollContainer?: boolean;
  
  // NEW: Render mode flags
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
  timelineScroll,
  resourceType,
  filters,
  showProblemsOnly = false,
  targetScrollItem,
  isWithinScrollContainer = false,
  renderOnlyLeft = false,
  renderOnlyTimeline = false
}: UnifiedCalendarProps) {
  
  // Performance tracking
  const loadStartTime = useRef(performance.now());
  const renderStartTime = useRef(performance.now());
  
  // UNIFIED: Use unified timeline scroll system
  const {
    timelineStart,
    timelineEnd,
    timelineDates,
    formattedDates,
    monthSections,
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
    equipmentRowsRef,
    stickyHeadersRef,
    loadMoreDates,
    scrollToDate,
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
  }), [timelineStart, timelineEnd]);

  // PERFORMANCE FIX: Use enabled flag to control data fetching
  const baseConfig = {
    periodStart: stableDataRange.start,
    periodEnd: stableDataRange.end,
    selectedOwner,
    visibleTimelineStart: timelineStart,
    visibleTimelineEnd: timelineEnd,
  };

  // Only fetch data for the active resource type
  const equipmentHubConfig = { ...baseConfig, enabled: resourceType === 'equipment' };
  const crewHubConfig = { ...baseConfig, enabled: resourceType === 'crew' };

  // Always call both hooks (Rules of Hooks) but only fetch data for active type
  const equipmentHub = useEquipmentHub(equipmentHubConfig);
  const crewHub = useCrewHub(crewHubConfig);
  
  // Get the current active hub
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
  
  // Cleanup stale states periodically
  const clearStaleStatesRef = useRef(clearStaleStates);
  clearStaleStatesRef.current = clearStaleStates;
  
  useEffect(() => {
    const interval = setInterval(() => {
      clearStaleStatesRef.current();
    }, PERFORMANCE.CACHE_CLEANUP_INTERVAL);

    return () => clearInterval(interval);
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

  // Optimized availability calculation
  const dateStrings = useMemo(() => formattedDates.map(d => d.dateStr), [formattedDates]);
  
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

  // Simply return TimelineContent - no complex conditional rendering needed
  return (
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
      getCrewRoleForDate={getCrewRoleForDate}
      equipmentRowsRef={equipmentRowsRef}
      handleTimelineScroll={(e) => {
        // Handle scroll only - unified system manages sync
        handleScroll(e);
      }}
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
  );
}