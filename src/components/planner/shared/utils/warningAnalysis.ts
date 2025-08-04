/**
 * Shared Warning Analysis Utilities
 * 
 * Consolidates common patterns between folderWarnings and crewWarnings
 */

export interface BaseWarning {
  hasIssues: boolean;
  issueCount: number;
}

export interface AnalysisConfig<T> {
  items: T[];
  formattedDates: Array<{ dateStr: string }>;
  getBookingForItem: (itemId: string, dateStr: string) => any;
  extractIssues: (booking: any, item: T) => { hasIssue: boolean; count: number };
}

/**
 * Generic warning analysis function that can be used for both equipment and crew
 */
export function analyzeWarnings<T extends { id: string }>(
  config: AnalysisConfig<T>
): { hasIssues: boolean; issueCount: number } {
  let totalIssueCount = 0;
  let hasAnyIssues = false;

  config.items.forEach(item => {
    config.formattedDates.forEach(dateInfo => {
      const booking = config.getBookingForItem(item.id, dateInfo.dateStr);
      if (booking) {
        const { hasIssue, count } = config.extractIssues(booking, item);
        if (hasIssue) {
          hasAnyIssues = true;
          totalIssueCount += count;
        }
      }
    });
  });

  return {
    hasIssues: hasAnyIssues,
    issueCount: totalIssueCount
  };
}

/**
 * Equipment-specific issue extraction
 */
export function extractEquipmentIssues(booking: any, equipment: any) {
  let hasIssue = false;
  let count = 0;

  if (booking.isOverbooked || booking.totalUsed > booking.stock) {
    hasIssue = true;
    count += 1;
  }

  if (booking.totalUsed === booking.stock) {
    hasIssue = true;
    count += 1;
  }

  if (booking.conflict && booking.conflict.severity !== 'resolved') {
    hasIssue = true;
    count += 1;
  }

  return { hasIssue, count };
}

/**
 * Crew-specific issue extraction
 */
export function extractCrewIssues(booking: any, crewMember: any) {
  let hasIssue = false;
  let count = 0;

  // Double booking detection
  if (booking.isOverbooked || (booking.totalUsed && booking.totalUsed > 1)) {
    hasIssue = true;
    count += 1;
  }

  // Missing assignment detection (crew member available but not assigned)
  if (!booking.bookings || booking.bookings.length === 0) {
    // This could indicate a missing assignment in some contexts
    // The specific logic would depend on business requirements
  }

  return { hasIssue, count };
}