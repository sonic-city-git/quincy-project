/**
 * Equipment Planner Constants
 * 
 * Centralized constants to avoid magic numbers and improve maintainability
 */

// Layout dimensions
export const LAYOUT = {
  // Column widths
  EQUIPMENT_NAME_WIDTH: 256, // Multiple of 16 for better alignment
  DAY_CELL_WIDTH: 48, // Multiple of 16 for better alignment
  
  // Row heights
  MAIN_FOLDER_HEIGHT: 48, // Standard height for main folder headers
  SUBFOLDER_HEIGHT: 40, // Standard height for subfolder headers
  EQUIPMENT_ROW_HEIGHT: 48, // Standard height for equipment/crew rows
  PROJECT_ROW_HEIGHT: 40, // Height per project row in expanded equipment view
  PROJECT_QUANTITY_CELL_HEIGHT: 32, // Height of quantity indicator cells
  
  // Header heights - Adjusted for content
  MONTH_HEADER_HEIGHT: 60, // Height for month section including year (needs space for 2 lines + padding)
  DATE_HEADER_HEIGHT: 52, // Height for date cells container
  DATE_CONTENT_HEIGHT: 42, // Height for actual date content (keeps highlights compact)
  STICKY_HEADER_TOP_OFFSET: 72,
} as const;

// Timeline settings - OPTIMIZED for infinite scroll
export const TIMELINE = {
  // Initial date range (days before/after selected date)
  INITIAL_DATE_BUFFER: 35,
  
  // Infinite scroll loading increments
  SCROLL_LOAD_INCREMENT: 14, // 2 weeks
  
  // OPTIMIZED: Enhanced scroll thresholds
  BASE_PRELOAD_THRESHOLD: 2000,    // Base distance from edge to trigger preload (was 800px)
  MAX_PRELOAD_THRESHOLD: 3500,     // Maximum threshold for high-velocity scrolling
  VELOCITY_MULTIPLIER: 10,         // Additional threshold per unit velocity
  
  // OPTIMIZED: Adaptive timing
  BASE_COOLDOWN: 300,              // Base cooldown between expansions (was 1000ms)
  MIN_COOLDOWN: 100,               // Minimum cooldown for high-velocity scrolling
  VELOCITY_THRESHOLD: 2,           // Velocity threshold for faster cooldown
  
  // OPTIMIZED: Debounce timing
  SCROLL_DEBOUNCE_MS: 16,          // 60fps throttling (was 100ms)
  POSITION_SYNC_THROTTLE: 50,      // Throttle for position state updates
} as const;

// Performance settings - OPTIMIZED for memory management
export const PERFORMANCE = {
  // OPTIMIZED: More aggressive cache cleanup to prevent memory leaks
  CACHE_CLEANUP_INTERVAL: 30 * 1000,     // 30 seconds (was 5 minutes)
  STALE_DATA_THRESHOLD: 2 * 60 * 1000,   // 2 minutes before data considered stale
  
  // OPTIMIZED: Virtualization settings for large date ranges
  VIRTUALIZATION_BUFFER: 5,               // Buffer for vertical virtualization
  HORIZONTAL_VIRTUALIZATION_BUFFER: 50,   // INCREASED: More buffer for smooth scrolling (was 20)
  MAX_RENDERED_DAYS: 180,                 // INCREASED: Higher threshold before virtualization kicks in (was 90)
  VIRTUAL_UPDATE_THROTTLE: 16,            // 60fps throttling for virtual timeline updates
  
  // OPTIMIZED: Animation frame optimization
  USE_REQUEST_ANIMATION_FRAME: true,
  SCROLL_RAF_THROTTLE: true,              // Use RAF for scroll position updates
  EXPANSION_RAF_RETRIES: 10,              // Max RAF retries for position adjustment
} as const;

// Visual settings
export const VISUAL = {
  // Opacity ranges for booking indicators (legacy - now using heatmap colors)
  MIN_BOOKING_OPACITY: 0.3,
  MAX_BOOKING_OPACITY: 1.0,
  BOOKING_OPACITY_RANGE: 0.7,
  
  // Heatmap colors for equipment and crew
  HEATMAP: {
    // Equipment color scheme:
    // Dark grey = normal usage (some availability remaining)
    // Orange = empty (all stock used)
    // Red = overbooked (more used than available)
    // 
    // Crew color scheme:
    // Subtle grey = available (no assignments)
    // Event colors = assigned (follows event type colors)
    // Red = conflict (multiple assignments)
    UTILIZATION_THRESHOLDS: [0.75, 1.0], // Legacy - no longer used
    COLORS: {
      NORMAL_DARK_GREY: '#374151',  // gray-700 - normal usage
      WARNING_ORANGE: '#f97316',    // orange-500 - empty equipment
      OVERBOOKED_BASE: '#dc2626',   // red-600 - overbooked equipment
      AVAILABLE_BASE: '#1f2937',    // gray-800 - very dark grey, barely visible on black
    },
    TEXT_COLORS: {
      LIGHT_GREY: '#d1d5db',  // gray-300 - for dark backgrounds
      WHITE: '#ffffff',       // white for high contrast on dark colors
    }
  },
  
  // Drag sensitivity
  DRAG_SENSITIVITY: 2,
} as const;