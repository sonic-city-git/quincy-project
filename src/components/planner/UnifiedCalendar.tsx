import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { format, isWeekend, isSameDay } from "date-fns";
import { Skeleton } from "../ui/skeleton";

import { useEquipmentHub } from './shared/hooks/useEquipmentHub';
import { useCrewHub } from './shared/hooks/useCrewHub';

import { useTimelineScroll } from './shared/hooks/useTimelineScroll';
import { LAYOUT, PERFORMANCE } from './shared/constants';

// Shared timeline components
import { PlannerFilters } from './shared/components/TimelineHeader';
import { TimelineContent } from './shared/components/TimelineContent';
import { SharedTimeline } from './shared/types/timeline';

interface UnifiedCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedOwner?: string;
  sharedTimeline: SharedTimeline;
  resourceType: 'equipment' | 'crew';
  filters?: PlannerFilters;
  showProblemsOnly?: boolean;
  targetScrollItem?: {
    type: 'equipment' | 'crew';
    id: string;
  } | null;
}

// Performance metrics for monitoring
interface PlannerMetrics {
  dataLoadTime: number;
  renderTime: number;
  activeResourceType: 'equipment' | 'crew';
  totalResources: number;
  visibleDateRange: number; // days
}

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
  sharedTimeline,
  resourceType,
  filters,
  showProblemsOnly = false,
  targetScrollItem
}: UnifiedCalendarProps) {
  
  // Performance tracking
  const loadStartTime = useRef(performance.now());
  const renderStartTime = useRef(performance.now());
  
  // Use shared timeline state
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
    visibleTimelineStart,
    visibleTimelineEnd,
  } = sharedTimeline;

  const scrollHandlers = useTimelineScroll({
    equipmentRowsRef,
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
    loadMoreDates,
    isMonthView: false, // Removed viewMode prop
  });

  // Note: Scroll logic is now simple - just scroll to center selected date

  // FAST: Simplified timeline scroll handling
  const handleTimelineScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    // Handle infinite scroll and drag functionality
    scrollHandlers.handleEquipmentScroll(e);
    
    // Simple header sync
    const scrollLeft = e.currentTarget.scrollLeft;
    if (stickyHeadersRef.current) {
      stickyHeadersRef.current.scrollLeft = scrollLeft;
    }
    
    // Clear any lingering scroll operations when user scrolls manually
    sharedTimeline.clearScrollTimeouts();
  }, [scrollHandlers, sharedTimeline]);

  // SIMPLE: Handle mouse move for drag
  const handleTimelineMouseMove = useCallback((e: React.MouseEvent) => {
    scrollHandlers.handleMouseMove(e);
    
    // Simple drag sync  
    if (isDragging && equipmentRowsRef.current && stickyHeadersRef.current) {
      const scrollLeft = equipmentRowsRef.current.scrollLeft;
      stickyHeadersRef.current.scrollLeft = scrollLeft;
    }
  }, [scrollHandlers.handleMouseMove, isDragging]);

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
    visibleTimelineStart,
    visibleTimelineEnd,
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
            // Simplified - just scroll to the target element immediately
            targetElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest'
            });
          } else {
            console.warn(`Could not find ${targetScrollItem.type} with ID: ${targetScrollItem.id}`);
          }
        } catch (error) {
          console.error('Error scrolling to target item:', error);
        }
      }, 100); // Much shorter delay - just enough for DOM to be ready
      
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
      handleTimelineScroll={handleTimelineScroll}
      handleTimelineMouseMove={handleTimelineMouseMove}
      scrollHandlers={scrollHandlers}
      isDragging={isDragging}
      getBookingsForEquipment={getBookingsForResource}
      getBookingState={getBookingState}
      updateBookingState={updateBookingState}
      getLowestAvailable={getAvailableCapacityForResource}
      resourceType={resourceType}
      filters={filters}
      showProblemsOnly={showProblemsOnly}
      visibleTimelineStart={sharedTimeline.visibleTimelineStart}
      visibleTimelineEnd={sharedTimeline.visibleTimelineEnd}
    />
  );
}