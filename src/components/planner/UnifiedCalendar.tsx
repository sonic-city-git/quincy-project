import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Skeleton } from "../ui/skeleton";
import { format } from "date-fns";

// Option to test unified system
import { useTimelineHub } from './shared/hooks/useTimelineHub';
import { useDashboardConflicts } from '@/hooks/global';


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

  // DEBUG: Track selectedDate at UnifiedCalendar level
  useEffect(() => {
    console.log('🟢 UNIFIED_CALENDAR selectedDate:', format(selectedDate, 'MMM dd yyyy'), 'resourceType:', resourceType, 'showProblems:', showProblemsOnly);
  }, [selectedDate, resourceType, showProblemsOnly]);
  
  // STATE PRESERVATION: Save/restore expansion state when toggling View Problems
  const savedExpansionStateRef = useRef<Set<string> | null>(null);
  const previousShowProblemsOnlyRef = useRef(showProblemsOnly);
  
  // Performance tracking
  const loadStartTime = useRef(performance.now());
  const renderStartTime = useRef(performance.now());
  
  // Remove excessive logging for better performance
  // console.log('UnifiedCalendar render', { selectedDate: selectedDate.toISOString() });

  // SIMPLIFIED: Use single consolidated scroll hook
  const timelineScroll = useTimelineScroll({ selectedDate, targetScrollItem, resourceType });
  
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
    setEquipmentRowsRef,
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
    warnings: hubWarnings, // Renamed to avoid confusion - these are incomplete (only expanded folders)
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
    setExpandedGroups, // ADDED: For efficient batch updates
    updateBookingState,
    getBookingState,
    batchUpdateBookings,
    clearStaleStates,
    resolveConflict,
  } = currentHub;

  // CRITICAL FIX: When "View Problems" is active, use comprehensive conflict detection
  // that fetches ALL equipment conflicts regardless of folder expansion state
  const { 
    equipmentConflicts: allEquipmentConflicts, 
    crewConflicts: allCrewConflicts,
    isLoading: isLoadingAllConflicts 
  } = useDashboardConflicts(selectedOwner);

  // Transform comprehensive conflicts into warnings format for TimelineContent
  const comprehensiveWarnings = useMemo(() => {
    if (!showProblemsOnly) {
      return hubWarnings; // Use normal hub warnings when not in problems-only mode
    }

    // When in problems-only mode, use comprehensive conflict data
    const allWarnings = [];
    
    if (resourceType === 'equipment' && allEquipmentConflicts) {
      allEquipmentConflicts.forEach(conflict => {
        allWarnings.push({
          resourceId: conflict.equipmentId,
          resourceName: conflict.equipmentName,
          date: conflict.date,
          type: 'overbooked',
          severity: conflict.overbooked > (conflict.totalStock * 0.5) ? 'high' : 'medium',
          details: {
            stock: conflict.totalStock,
            used: conflict.totalUsed,
            overbooked: conflict.overbooked,
            events: conflict.conflictingEvents
          }
        });
      });
    } else if (resourceType === 'crew' && allCrewConflicts) {
      allCrewConflicts.forEach(conflict => {
        allWarnings.push({
          resourceId: conflict.crewMemberId,
          resourceName: conflict.crewMemberName,
          date: conflict.date,
          type: 'conflict',
          severity: conflict.conflictingAssignments.length > 2 ? 'high' : 'medium',
          details: {
            assignments: conflict.conflictingAssignments
          }
        });
      });
    }

    // Debug logging for crew conflicts
    if (process.env.NODE_ENV === 'development' && resourceType === 'crew') {
      console.log('👥 Crew mode - allCrewConflicts:', allCrewConflicts);
      console.log('⚠️ Transformed crew warnings:', allWarnings);
      console.log('🔍 showProblemsOnly:', showProblemsOnly, 'warnings found:', allWarnings.length);
    }

    return allWarnings;
  }, [showProblemsOnly, resourceType, allEquipmentConflicts, allCrewConflicts, hubWarnings]);

  // Use comprehensive warnings when available, fallback to hub warnings
  const warnings = comprehensiveWarnings;

  // EXPANSION STATE PRESERVATION: Save and restore folder expansion when toggling View Problems
  useEffect(() => {
    const wasShowingProblems = previousShowProblemsOnlyRef.current;
    const isNowShowingProblems = showProblemsOnly;
    
    // User just turned ON "View Problems" - save current expansion state
    if (!wasShowingProblems && isNowShowingProblems) {
      savedExpansionStateRef.current = new Set(expandedGroups);
    }
    
    // User just turned OFF "View Problems" - restore saved expansion state  
    if (wasShowingProblems && !isNowShowingProblems && savedExpansionStateRef.current) {
      // CREW-SPECIFIC: Preserve scroll state more aggressively during expansion restoration
      console.log(`🔄 [${resourceType.toUpperCase()}] RESTORING EXPANSION STATE after View Problems toggle`);
      
      if (resourceType === 'crew') {
        // For crew tab, ensure scroll state is preserved during expansion changes
        const currentScrollPosition = equipmentRowsRef?.current?.scrollLeft || 0;
        console.log(`👥 [CREW] Preserving scroll position: ${currentScrollPosition} before expansion restoration`);
        
        setTimeout(() => {
          setExpandedGroups(new Set(savedExpansionStateRef.current!));
          savedExpansionStateRef.current = null;
          
          // Extra restoration step for crew tab
          setTimeout(() => {
            if (equipmentRowsRef?.current && equipmentRowsRef.current.scrollLeft !== currentScrollPosition) {
              equipmentRowsRef.current.scrollLeft = currentScrollPosition;
              console.log(`👥 [CREW] Restored scroll position: ${currentScrollPosition} after expansion changes`);
            }
          }, 50);
        }, 0);
      } else {
        // Equipment tab - simpler restoration
        setTimeout(() => {
          setExpandedGroups(new Set(savedExpansionStateRef.current!));
          savedExpansionStateRef.current = null;
        }, 0);
      }
    }
    
    // Update previous state
    previousShowProblemsOnlyRef.current = showProblemsOnly;
  }, [showProblemsOnly, setExpandedGroups]);

  // REMOVED: Performance metrics logging to reduce console spam

  // Delay stale state cleanup to avoid interfering with initial scroll
  useEffect(() => {
    const timer = setTimeout(() => {
      clearStaleStates();
    }, 5000); // Wait 5 seconds after mount before starting cleanup
    return () => clearTimeout(timer);
  }, []);

  // NOTE: All scroll handling now consolidated in useSimpleInfiniteScroll hook

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
      {/* Conditional Timeline Header - Only render if not renderOnlyTimeline */}
      {!renderOnlyTimeline && (
        <div className="sticky top-0 z-30 bg-background border-b border-border">
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
        </div>
      )}

      {/* Timeline Header - Only month/date headers when renderOnlyTimeline */}
      {renderOnlyTimeline && (
        <div className="sticky top-0 z-30 bg-background border-b border-border">
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
            renderOnlyTimeline={true}
          />
        </div>
      )}
      
      {/* Scrollable content area - Adjusted height to account for sticky header */}
      <div className="overflow-y-auto" style={{ maxHeight: renderOnlyTimeline ? 'calc(100vh - 300px)' : 'calc(100vh - 402px)' }}>
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
        setEquipmentRowsRef={setEquipmentRowsRef}
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
        warnings={warnings} // PERFORMANCE: Pass pre-calculated warnings for optimized problems view
        visibleTimelineStart={timelineStart}
        visibleTimelineEnd={timelineEnd}
        isWithinScrollContainer={isWithinScrollContainer}
      />
      </div>
    </div>
  );
}