/**
 * CONSOLIDATED: TimelineMemo - Eliminates memo duplication
 * 
 * Replaces 60+ lines of identical memo logic across 4+ timeline components
 * Provides standardized memoization patterns for timeline performance
 */

import { memo, ReactElement } from 'react';

// Common props that all timeline components share
export interface TimelineBaseProps {
  equipmentGroups?: any[];
  expandedGroups?: Set<string>;
  expandedEquipment?: Set<string>;
  isDragging?: boolean;
  filters?: any;
  resourceType?: 'equipment' | 'crew';
  showProblemsOnly?: boolean;
  formattedDates?: Array<{
    dateStr: string;
    isSelected: boolean;
    isToday: boolean;
    [key: string]: any;
  }>;
}

// Function props that need stability checking
export interface TimelineFunctionProps {
  toggleGroup?: (groupKey: string, expandAllSubfolders?: boolean) => void;
  toggleEquipmentExpansion?: (resourceId: string) => void;
  getBookingForEquipment?: (resourceId: string, dateStr: string) => any;
  getProjectQuantityForDate?: (projectName: string, resourceId: string, dateStr: string) => any;
  getCrewRoleForDate?: (projectName: string, crewMemberId: string, dateStr: string) => any;
  onToggleExpansion?: (resourceId: string) => void;
  [key: string]: any; // Allow additional function props
}

// Combined props interface
export interface TimelineMemoProps extends TimelineBaseProps, TimelineFunctionProps {
  [key: string]: any; // Allow additional props
}

/**
 * Generic memo comparison function for timeline components
 */
export function createTimelineMemoComparison<T extends TimelineMemoProps>(
  additionalChecks?: (prevProps: T, nextProps: T) => boolean
) {
  return (prevProps: T, nextProps: T): boolean => {
    // Basic props that must match
    if (
      prevProps.equipmentGroups?.length !== nextProps.equipmentGroups?.length ||
      prevProps.expandedGroups !== nextProps.expandedGroups ||
      prevProps.expandedEquipment !== nextProps.expandedEquipment ||
      prevProps.isDragging !== nextProps.isDragging ||
      prevProps.filters !== nextProps.filters ||
      prevProps.showProblemsOnly !== nextProps.showProblemsOnly ||
      prevProps.resourceType !== nextProps.resourceType
    ) {
      return false;
    }
    
    // Function references that should be stable
    const functionProps = [
      'toggleGroup',
      'toggleEquipmentExpansion', 
      'getProjectQuantityForDate',
      'getCrewRoleForDate',
      'onToggleExpansion'
    ];
    
    for (const funcProp of functionProps) {
      if (prevProps[funcProp] !== nextProps[funcProp]) {
        return false;
      }
    }
    
    // CRITICAL: Check if booking function changed
    if (prevProps.getBookingForEquipment !== nextProps.getBookingForEquipment) {
      return false;
    }
    
    // Smart date comparison for timeline expansion
    const prevDates = prevProps.formattedDates;
    const nextDates = nextProps.formattedDates;
    
    if (!prevDates || !nextDates) {
      return prevDates === nextDates;
    }
    
    // If lengths are equal, check if content is the same AND selected date hasn't changed
    if (prevDates.length === nextDates.length) {
      const firstLastSame = (
        prevDates[0]?.dateStr === nextDates[0]?.dateStr &&
        prevDates[prevDates.length - 1]?.dateStr === nextDates[nextDates.length - 1]?.dateStr
      );
      
      // Also check if selected date has changed within the range
      const prevSelectedIndex = prevDates.findIndex(d => d.isSelected);
      const nextSelectedIndex = nextDates.findIndex(d => d.isSelected);
      const selectedChanged = prevSelectedIndex !== nextSelectedIndex;
      
      if (!firstLastSame || selectedChanged) {
        return false;
      }
    } else {
      // Different lengths - force re-render
      return false;
    }
    
    // Additional component-specific checks
    if (additionalChecks) {
      return additionalChecks(prevProps, nextProps);
    }
    
    return true;
  };
}

/**
 * Higher-order component for timeline memoization
 */
export function withTimelineMemo<T extends TimelineMemoProps>(
  Component: React.ComponentType<T>,
  additionalChecks?: (prevProps: T, nextProps: T) => boolean
) {
  const MemoizedComponent = memo(Component, createTimelineMemoComparison(additionalChecks));
  MemoizedComponent.displayName = `withTimelineMemo(${Component.displayName || Component.name})`;
  return MemoizedComponent;
}

/**
 * Specialized memo for equipment/resource specific checks
 */
export function createResourceMemoComparison<T extends TimelineMemoProps & { equipment?: any; resourceId?: string }>(
  additionalChecks?: (prevProps: T, nextProps: T) => boolean
) {
  return createTimelineMemoComparison<T>((prevProps, nextProps) => {
    // Equipment/resource specific checks
    if (prevProps.equipment?.id !== nextProps.equipment?.id || 
        prevProps.equipment?.stock !== nextProps.equipment?.stock ||
        prevProps.resourceId !== nextProps.resourceId) {
      return false;
    }
    
    // Run additional checks if provided
    if (additionalChecks) {
      return additionalChecks(prevProps, nextProps);
    }
    
    return true;
  });
}

/**
 * Specialized memo for date-specific components
 */
export function createDateMemoComparison<T extends TimelineMemoProps & { dateInfo?: any }>(
  additionalChecks?: (prevProps: T, nextProps: T) => boolean
) {
  return createTimelineMemoComparison<T>((prevProps, nextProps) => {
    // Date-specific checks
    if (prevProps.dateInfo?.dateStr !== nextProps.dateInfo?.dateStr || 
        prevProps.dateInfo?.isToday !== nextProps.dateInfo?.isToday ||
        prevProps.dateInfo?.isSelected !== nextProps.dateInfo?.isSelected) {
      return false;
    }
    
    // Run additional checks if provided
    if (additionalChecks) {
      return additionalChecks(prevProps, nextProps);
    }
    
    return true;
  });
}

/**
 * Generic timeline performance hook for common calculations
 */
export function useTimelinePerformance<T>(
  formattedDates: Array<{ dateStr: string; [key: string]: any }>,
  calculator: (dates: Array<{ dateStr: string; [key: string]: any }>) => T,
  dependencies: any[] = []
) {
  return useMemo(() => {
    return calculator(formattedDates);
  }, [
    formattedDates.length,
    formattedDates.length > 0 ? `${formattedDates[0].dateStr}-${formattedDates[formattedDates.length - 1].dateStr}` : '',
    ...dependencies
  ]);
}

// Export types for convenience
export type { TimelineBaseProps, TimelineFunctionProps, TimelineMemoProps };