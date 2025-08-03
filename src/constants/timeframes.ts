// Global timeframe constants for operational warnings and conflict detection
// These should be used consistently across all overbooking and conflict warning systems

/**
 * Standard timeframe for equipment overbooking warnings (in days)
 * Used in: Dashboard operational status, Global search, Planner warnings, etc.
 */
export const OVERBOOKING_WARNING_DAYS = 30;

/**
 * Standard timeframe for crew double-booking warnings (in days)  
 * Used in: Dashboard operational status, Global search, Crew management, etc.
 */
export const CREW_CONFLICT_WARNING_DAYS = 30;

/**
 * Helper functions for consistent date calculations
 * Returns a 30-day timeframe starting from today (inclusive)
 */
export const getWarningTimeframe = () => {
  const startDate = new Date().toISOString().split('T')[0]; // Today (inclusive)
  const endDate = new Date(Date.now() + OVERBOOKING_WARNING_DAYS * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  return { startDate, endDate };
};

export const getCrewWarningTimeframe = () => {
  const startDate = new Date().toISOString().split('T')[0]; // Today (inclusive)
  const endDate = new Date(Date.now() + CREW_CONFLICT_WARNING_DAYS * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  return { startDate, endDate };
};