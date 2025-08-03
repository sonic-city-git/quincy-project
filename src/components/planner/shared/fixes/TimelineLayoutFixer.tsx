/**
 * PLANNER BUG FIXES: Timeline Layout & Alignment
 * 
 * Fixes critical alignment and layout issues:
 * 1. Row alignment - ProjectRow cell width mismatch (50px vs 48px)
 * 2. Scroll synchronization improvements
 * 3. Layout consistency across timeline components
 */

import { LAYOUT } from '../constants';

/**
 * Layout utility functions for consistent sizing
 */
export const TimelineLayout = {
  // Consistent cell dimensions
  getCellStyle: () => ({
    width: LAYOUT.DAY_CELL_WIDTH,
    minWidth: LAYOUT.DAY_CELL_WIDTH,
    maxWidth: LAYOUT.DAY_CELL_WIDTH,
    height: LAYOUT.PROJECT_ROW_HEIGHT,
  }),

  // Consistent timeline width calculation
  getTimelineWidth: (dateCount: number) => dateCount * LAYOUT.DAY_CELL_WIDTH,

  // Consistent name column style
  getNameColumnStyle: () => ({
    width: LAYOUT.EQUIPMENT_NAME_WIDTH,
    minWidth: LAYOUT.EQUIPMENT_NAME_WIDTH,
    maxWidth: LAYOUT.EQUIPMENT_NAME_WIDTH,
  }),

  // Consistent row height
  getRowStyle: (rowType: 'main' | 'project' | 'subfolder') => {
    const heightMap = {
      main: LAYOUT.EQUIPMENT_ROW_HEIGHT,
      project: LAYOUT.PROJECT_ROW_HEIGHT,
      subfolder: LAYOUT.SUBFOLDER_HEIGHT,
    };
    
    return {
      height: heightMap[rowType],
      minHeight: heightMap[rowType],
    };
  },

  // Get alignment-safe styles for project rows
  getProjectRowStyles: (formattedDates: any[]) => ({
    nameColumn: {
      ...TimelineLayout.getNameColumnStyle(),
      display: 'flex',
      alignItems: 'center',
      paddingLeft: '3rem', // 12 * 4 = 48px
      fontSize: '0.875rem', // text-sm
      color: 'rgb(156 163 175)', // text-muted-foreground
    },
    timelineContainer: {
      display: 'flex',
      alignItems: 'center',
      minWidth: TimelineLayout.getTimelineWidth(formattedDates.length),
      height: '100%',
    },
    cell: {
      ...TimelineLayout.getCellStyle(),
      padding: '0.25rem', // px-1
      position: 'relative' as const,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }
  }),
};

/**
 * Scroll synchronization utilities
 */
export const ScrollSync = {
  // Sync header scroll to content
  syncHeaderToContent: (headerRef: React.RefObject<HTMLDivElement>, scrollLeft: number) => {
    if (headerRef.current && headerRef.current.scrollLeft !== scrollLeft) {
      headerRef.current.scrollLeft = scrollLeft;
    }
  },

  // Sync content scroll to header
  syncContentToHeader: (contentRef: React.RefObject<HTMLDivElement>, scrollLeft: number) => {
    if (contentRef.current && contentRef.current.scrollLeft !== scrollLeft) {
      contentRef.current.scrollLeft = scrollLeft;
    }
  },

  // Bidirectional sync utility
  createSyncHandler: (
    sourceRef: React.RefObject<HTMLDivElement>,
    targetRef: React.RefObject<HTMLDivElement>
  ) => {
    return (e: React.UIEvent<HTMLDivElement>) => {
      const scrollLeft = e.currentTarget.scrollLeft;
      if (targetRef.current && targetRef.current.scrollLeft !== scrollLeft) {
        targetRef.current.scrollLeft = scrollLeft;
      }
    };
  },

  // Enhanced sync with RAF for smooth performance
  createRAFSyncHandler: (
    sourceRef: React.RefObject<HTMLDivElement>,
    targetRef: React.RefObject<HTMLDivElement>
  ) => {
    let rafId: number | null = null;
    
    return (e: React.UIEvent<HTMLDivElement>) => {
      if (rafId) cancelAnimationFrame(rafId);
      
      rafId = requestAnimationFrame(() => {
        const scrollLeft = e.currentTarget.scrollLeft;
        if (targetRef.current && targetRef.current.scrollLeft !== scrollLeft) {
          targetRef.current.scrollLeft = scrollLeft;
        }
      });
    };
  }
};

/**
 * Enhanced problems detection that doesn't depend on viewport
 */
export const ProblemsDetection = {
  // Check for problems across ALL dates, not just visible ones
  hasProblemsAnyDate: (
    item: any, 
    allFormattedDates: any[], 
    getBookingForEquipment: (id: string, dateStr: string) => any,
    resourceType: 'equipment' | 'crew'
  ): boolean => {
    // For unfilled roles: they are always a "problem"
    if (item?.availability === 'needed') return true;
    
    if (!item?.id || allFormattedDates.length === 0) {
      return false;
    }
    
    const isCrewMode = resourceType === 'crew';
    
    // Check ALL dates, not just visible ones
    for (const dateInfo of allFormattedDates) {
      if (dateInfo?.dateStr) {
        const booking = getBookingForEquipment(item.id, dateInfo.dateStr);
        if (booking && booking.bookings && booking.bookings.length > 0) {
          if (isCrewMode) {
            // For crew: check for overbooking
            if (booking.isOverbooked || (booking.totalUsed && booking.totalUsed > 1)) {
              return true;
            }
          } else {
            // For equipment: check for overbooking and conflicts
            if (booking.isOverbooked || 
                (booking.totalUsed > booking.stock) || 
                (booking.conflict && booking.conflict.severity !== 'resolved')) {
              return true;
            }
          }
        }
      }
    }
    
    return false;
  },

  // Filter items by problems status
  filterByProblems: (
    items: any[],
    allFormattedDates: any[],
    getBookingForEquipment: (id: string, dateStr: string) => any,
    resourceType: 'equipment' | 'crew',
    showProblemsOnly: boolean
  ) => {
    if (!showProblemsOnly) return items;
    
    return items.filter(item => 
      ProblemsDetection.hasProblemsAnyDate(
        item, 
        allFormattedDates, 
        getBookingForEquipment, 
        resourceType
      )
    );
  }
};

/**
 * Expansion state management utilities
 */
export const ExpansionSync = {
  // Resolve conflicts between filter-based and persistent expansion
  resolveExpansionState: (
    groupKey: string,
    persistentExpandedGroups: Set<string>,
    filterBasedExpansion: boolean | undefined,
    hasActiveFilters: boolean
  ): boolean => {
    // When filters are active, use filter-based expansion
    if (hasActiveFilters && filterBasedExpansion !== undefined) {
      return filterBasedExpansion;
    }
    
    // Otherwise, use persistent expansion state
    return persistentExpandedGroups.has(groupKey);
  },

  // Create unified expansion toggle
  createExpansionToggle: (
    persistentToggle: (groupKey: string, expandAllSubfolders?: boolean, subFolderKeys?: string[]) => void,
    equipmentGroups: any[]
  ) => {
    return (groupKey: string, expandAllSubfolders?: boolean) => {
      if (expandAllSubfolders) {
        const group = equipmentGroups.find(g => g.mainFolder === groupKey);
        const subFolderKeys = group?.subFolders?.map(
          (subFolder: any) => `${groupKey}/${subFolder.name}`
        ) || [];
        
        persistentToggle(groupKey, expandAllSubfolders, subFolderKeys);
      } else {
        persistentToggle(groupKey, false);
      }
    };
  }
};

// Export all utilities as a consolidated toolkit
export const TimelineFixKit = {
  Layout: TimelineLayout,
  ScrollSync,
  ProblemsDetection,
  ExpansionSync,
};

export default TimelineFixKit;