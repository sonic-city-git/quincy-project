/**
 * Equipment Planner Constants
 * 
 * Centralized constants to avoid magic numbers and improve maintainability
 */

// Layout dimensions
export const LAYOUT = {
  // Column widths
  EQUIPMENT_NAME_WIDTH: 240,
  DAY_CELL_WIDTH: 50,
  
  // Row heights
  MAIN_FOLDER_HEIGHT: 57,
  SUBFOLDER_HEIGHT: 41,
  EQUIPMENT_ROW_HEIGHT: 60,
  
  // Header heights
  MONTH_HEADER_HEIGHT: 12,
  DATE_HEADER_HEIGHT: 12,
  STICKY_HEADER_TOP_OFFSET: 72,
} as const;

// Timeline settings
export const TIMELINE = {
  // Initial date range (days before/after selected date)
  INITIAL_DATE_BUFFER: 35,
  
  // Infinite scroll loading increments
  SCROLL_LOAD_INCREMENT: 14, // 2 weeks
  
  // Scroll thresholds for loading more data
  SCROLL_THRESHOLD: 0.3,
  
  // Debounce timing
  SCROLL_DEBOUNCE_MS: 100,
} as const;

// Performance settings
export const PERFORMANCE = {
  // Cache cleanup interval
  CACHE_CLEANUP_INTERVAL: 5 * 60 * 1000, // 5 minutes
  
  // Virtualization buffer
  VIRTUALIZATION_BUFFER: 5,
  HORIZONTAL_VIRTUALIZATION_BUFFER: 10,
  
  // Animation frame throttling
  USE_REQUEST_ANIMATION_FRAME: true,
} as const;

// Visual settings
export const VISUAL = {
  // Opacity ranges for booking indicators (legacy - now using heatmap colors)
  MIN_BOOKING_OPACITY: 0.3,
  MAX_BOOKING_OPACITY: 1.0,
  BOOKING_OPACITY_RANGE: 0.7,
  
  // Simplified heatmap colors for equipment utilization (no green)
  HEATMAP: {
    // Color scheme:
    // Dark grey = 0-74% utilized (normal usage)
    // Orange = 75-100% utilized (getting low/empty)
    // Red = overbooked
    UTILIZATION_THRESHOLDS: [0.75, 1.0],
    COLORS: {
      NORMAL_DARK_GREY: '#374151',  // gray-700 - 0-74% utilized (dark grey for normal usage)
      WARNING_ORANGE: '#f97316',    // orange-500 - 75-100% utilized (warning/getting low)
      OVERBOOKED_BASE: '#dc2626',   // red-600 - overbooked (red)
    },
    TEXT_COLORS: {
      LIGHT_GREY: '#d1d5db',  // gray-300 - for dark backgrounds
      WHITE: '#ffffff',       // white for high contrast on dark colors
    }
  },
  
  // Drag sensitivity
  DRAG_SENSITIVITY: 2,
} as const;