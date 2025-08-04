/**
 * Centralized Error Handling for Planner Components
 * 
 * Provides consistent error handling patterns across the planner system
 */

export interface PlannerError {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
  timestamp: Date;
}

export class PlannerErrorHandler {
  private static errors: PlannerError[] = [];
  
  static logError(code: string, message: string, severity: PlannerError['severity'] = 'medium', context?: Record<string, any>) {
    const error: PlannerError = {
      code,
      message,
      severity,
      context,
      timestamp: new Date()
    };
    
    this.errors.push(error);
    
    // Keep only last 100 errors to prevent memory leaks
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100);
    }
    
    // In development, also log to console with appropriate level
    if (process.env.NODE_ENV === 'development') {
      const logMethod = severity === 'critical' ? 'error' : 
                       severity === 'high' ? 'warn' : 'log';
      console[logMethod](`[Planner] ${code}: ${message}`, context);
    }
  }
  
  static getErrors(): PlannerError[] {
    return [...this.errors];
  }
  
  static clearErrors(): void {
    this.errors = [];
  }
  
  static getErrorsForCode(code: string): PlannerError[] {
    return this.errors.filter(error => error.code === code);
  }
}

// Specific error codes for the planner
export const PLANNER_ERROR_CODES = {
  // Data fetching errors
  CREW_FETCH_FAILED: 'CREW_FETCH_FAILED',
  EQUIPMENT_FETCH_FAILED: 'EQUIPMENT_FETCH_FAILED',
  ASSIGNMENTS_FETCH_FAILED: 'ASSIGNMENTS_FETCH_FAILED',
  
  // Cache errors
  CACHE_PARSE_FAILED: 'CACHE_PARSE_FAILED',
  CACHE_STORAGE_FAILED: 'CACHE_STORAGE_FAILED',
  
  // UI errors
  SCROLL_TARGET_NOT_FOUND: 'SCROLL_TARGET_NOT_FOUND',
  SCROLL_OPERATION_FAILED: 'SCROLL_OPERATION_FAILED',
  
  // Timeline errors
  TIMELINE_ALIGNMENT_MISMATCH: 'TIMELINE_ALIGNMENT_MISMATCH',
  
  // Performance warnings
  SLOW_OPERATION: 'SLOW_OPERATION',
  MEMORY_LEAK_DETECTED: 'MEMORY_LEAK_DETECTED'
} as const;

// Helper functions for common error scenarios
export const handleError = {
  crewFetch: (error: any) => PlannerErrorHandler.logError(
    PLANNER_ERROR_CODES.CREW_FETCH_FAILED,
    'Failed to fetch crew data',
    'high',
    { error: error?.message || error }
  ),
  
  equipmentFetch: (error: any) => PlannerErrorHandler.logError(
    PLANNER_ERROR_CODES.EQUIPMENT_FETCH_FAILED,
    'Failed to fetch equipment data',
    'high',
    { error: error?.message || error }
  ),
  
  assignmentsFetch: (error: any) => PlannerErrorHandler.logError(
    PLANNER_ERROR_CODES.ASSIGNMENTS_FETCH_FAILED,
    'Failed to fetch crew assignments',
    'medium',
    { error: error?.message || error }
  ),
  
  cacheParse: (error: any) => PlannerErrorHandler.logError(
    PLANNER_ERROR_CODES.CACHE_PARSE_FAILED,
    'Failed to parse cached data',
    'low',
    { error: error?.message || error }
  ),
  
  cacheStorage: (error: any) => PlannerErrorHandler.logError(
    PLANNER_ERROR_CODES.CACHE_STORAGE_FAILED,
    'Failed to store data in cache',
    'low',
    { error: error?.message || error }
  ),
  
  scrollTargetNotFound: (targetType: string, targetId: string) => PlannerErrorHandler.logError(
    PLANNER_ERROR_CODES.SCROLL_TARGET_NOT_FOUND,
    `Could not find ${targetType} with ID: ${targetId}`,
    'medium',
    { targetType, targetId }
  ),
  
  scrollOperationFailed: (error: any) => PlannerErrorHandler.logError(
    PLANNER_ERROR_CODES.SCROLL_OPERATION_FAILED,
    'Scroll operation failed',
    'low',
    { error: error?.message || error }
  ),
  
  timelineAlignmentMismatch: (mismatches: string[]) => PlannerErrorHandler.logError(
    PLANNER_ERROR_CODES.TIMELINE_ALIGNMENT_MISMATCH,
    'Timeline components are misaligned',
    'critical',
    { mismatches }
  )
};