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

  // Note: Header scroll is now handled in Planner.tsx

  // STABLE data range - no debouncing on initial load to prevent "pop" effect
  const [stableDataRange, setStableDataRange] = useState({
    start: timelineStart,
    end: timelineEnd
  });
  
  const lastTimelineChangeRef = useRef(Date.now());
  const isInitialLoad = useRef(true);
  
  useEffect(() => {
    const now = Date.now();
    const timeSinceLastChange = now - lastTimelineChangeRef.current;
    lastTimelineChangeRef.current = now;
    
    // On initial load, update immediately to prevent pop effect
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      setStableDataRange({
        start: timelineStart,
        end: timelineEnd
      });
      return;
    }
    
    // For subsequent changes, only debounce rapid expansions
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

  // Always call both hooks but with enabled/disabled flag to respect Rules of Hooks
  const hubConfig = {
    periodStart: stableDataRange.start,
    periodEnd: stableDataRange.end,
    selectedOwner,
    visibleTimelineStart,
    visibleTimelineEnd,
    enabled: true, // Add enabled flag
  };

  const equipmentHubConfig = { ...hubConfig, enabled: resourceType === 'equipment' };
  const crewHubConfig = { ...hubConfig, enabled: resourceType === 'crew' };

  // Always call both hooks to maintain hook call order
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

  // Log performance metrics in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && equipmentGroups.length > 0) {
      const loadTime = performance.now() - loadStartTime.current;
      const metrics: PlannerMetrics = {
        dataLoadTime: Math.round(loadTime),
        renderTime: Math.round(performance.now() - renderStartTime.current),
        activeResourceType: resourceType,
        totalResources: equipmentGroups.reduce((sum, group) => sum + group.equipment.length, 0),
        visibleDateRange: Math.ceil((timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24))
      };
      console.debug('🔧 Planner Performance Metrics:', metrics);
    }
  }, [equipmentGroups, resourceType, timelineStart, timelineEnd]);

  // Handle scrolling to target item when targetScrollItem is provided
  useEffect(() => {
    if (targetScrollItem && targetScrollItem.type === resourceType && equipmentGroups.length > 0) {
      const timer = setTimeout(() => {
        try {
          // Look for the target item in the DOM
          const targetElement = document.querySelector(`[data-resource-id="${targetScrollItem.id}"]`);
          
          if (targetElement && equipmentRowsRef.current) {
            // Scroll to the target element
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
      }, 500); // Wait for render
      
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