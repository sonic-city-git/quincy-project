/**
 * QUINCY Nordic Design System - Simplified
 * 
 * PHILOSOPHY: CSS Variables + Tailwind + Minimal JavaScript
 * - All colors defined in CSS variables (index.css)
 * - This file only for complex calculations or custom components
 * - shadcn/ui works naturally with CSS variables
 * - Easy to change entire app theme by updating CSS
 */

// ===== SIMPLE COLOR REFERENCE =====
// These reference the CSS variables defined in index.css
// Use these ONLY when you need the actual hex values in JavaScript

export const COLORS = {
  // Backgrounds (light & airy)
  WHITE: 'var(--nordic-white)',
  GRAY_50: 'var(--nordic-gray-50)',
  GRAY_100: 'var(--nordic-gray-100)',
  GRAY_200: 'var(--nordic-gray-200)',
  GRAY_300: 'var(--nordic-gray-300)',
  GRAY_400: 'var(--nordic-gray-400)',
  GRAY_500: 'var(--nordic-gray-500)',
  GRAY_600: 'var(--nordic-gray-600)',
  GRAY_700: 'var(--nordic-gray-700)',
  GRAY_800: 'var(--nordic-gray-800)',
  GRAY_900: 'var(--nordic-gray-900)',
  
  // Brand colors (vibrant yet calming)
  PRIMARY: 'var(--nordic-primary)',     // Indigo
  SECONDARY: 'var(--nordic-secondary)', // Cyan  
  ACCENT: 'var(--nordic-accent)',       // Purple
  
  // Status colors
  SUCCESS: 'var(--nordic-success)',     // Emerald
  WARNING: 'var(--nordic-warning)',     // Amber
  ERROR: 'var(--nordic-error)',         // Red
  INFO: 'var(--nordic-info)',           // Blue
} as const

// ===== SIMPLIFIED FOUNDATION =====
// Keep only what we actually use in JavaScript

export const FOUNDATION = {
  BACKGROUND: {
    PRIMARY: COLORS.WHITE,
    SECONDARY: COLORS.GRAY_50,
    TERTIARY: COLORS.GRAY_100,
  },
  
  GRAY: {
    50: COLORS.GRAY_50,
    100: COLORS.GRAY_100,
    200: COLORS.GRAY_200,
    300: COLORS.GRAY_300,
    400: COLORS.GRAY_400,
    500: COLORS.GRAY_500,
    600: COLORS.GRAY_600,
    700: COLORS.GRAY_700,
    800: COLORS.GRAY_800,
    900: COLORS.GRAY_900,
  },
  
  STATUS: {
    SUCCESS: { 500: COLORS.SUCCESS, 600: COLORS.SUCCESS },
    WARNING: { 500: COLORS.WARNING, 600: COLORS.WARNING },
    ERROR: { 500: COLORS.ERROR, 600: COLORS.ERROR },
    INFO: { 500: COLORS.INFO, 600: COLORS.INFO },
  },
  
  ACCENT: {
    PRIMARY: COLORS.PRIMARY,
    SECONDARY: COLORS.SECONDARY,
  }
}

// ===== TYPOGRAPHY =====
// Simple font weights and sizes

export const TYPOGRAPHY = {
  WEIGHT: {
    LIGHT: 300,
    NORMAL: 400,
    MEDIUM: 500,
    SEMIBOLD: 600,
    BOLD: 700,
  },
  
  SIZE: {
    XS: '12px',
    SM: '14px',
    BASE: '16px',
    LG: '18px',
    XL: '20px',
    '2XL': '24px',
  }
}

// ===== SPACING =====
// Reference to Tailwind's spacing scale

export const SPACING = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  12: '48px',
  16: '64px',
  20: '80px',
}

// ===== LAYOUT =====
// Simple layout constants

export const LAYOUT = {
  BORDER: {
    WIDTH: '1px',
    WIDTH_THIN: '0.5px',
    COLOR: COLORS.GRAY_200,
    COLOR_MEDIUM: COLORS.GRAY_300,
  },
  
  RADIUS: {
    SM: '4px',
    DEFAULT: '6px',
    MD: '8px',
    LG: '12px',
    XL: '16px',
  },
  
  SHADOW: {
    XS: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    SM: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    DEFAULT: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    LG: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    XL: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  
  CONTAINER: {
    MAX_WIDTH: '1400px',
  }
}

// ===== DOMAIN-SPECIFIC COMPONENTS =====
// Only for complex business logic components

export const EQUIPMENT_STATUS = {
  AVAILABLE: COLORS.SUCCESS,
  BOOKED: COLORS.WARNING,
  MAINTENANCE: COLORS.ERROR,
  TRANSIT: COLORS.INFO,
}

// ===== APP LAYOUT =====
// Navigation and page layout styling

export const APP_LAYOUT = {
  NAVIGATION: {
    BACKGROUND: COLORS.WHITE,
    BORDER_BOTTOM: `1px solid ${COLORS.GRAY_200}`,
    SHADOW: LAYOUT.SHADOW.SM,
    HEIGHT: '64px',
    PADDING: SPACING[4],
    
    LOGO: {
      COLOR: COLORS.PRIMARY,
      SIZE: TYPOGRAPHY.SIZE['2XL'],
      WEIGHT: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    },
    
    LINK: {
      COLOR: COLORS.GRAY_600,
      COLOR_HOVER: COLORS.GRAY_800,
      COLOR_ACTIVE: COLORS.PRIMARY,
      BACKGROUND_HOVER: COLORS.GRAY_50,
      TRANSITION: 'all 200ms ease',
    },
  },
  
  PAGE: {
    SPACING: SPACING[6],
    TITLE_SIZE: TYPOGRAPHY.SIZE['2XL'],
    TITLE_WEIGHT: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    TITLE_COLOR: COLORS.GRAY_800,
    SUBTITLE_COLOR: COLORS.GRAY_600,
  },
  
  MAIN: {
    PADDING: SPACING[6],
    MAX_WIDTH: LAYOUT.CONTAINER.MAX_WIDTH,
    MARGIN: '0 auto',
  }
} as const

// ===== LEGACY COMPATIBILITY =====
// For components that still use the old structure

export const QUINCY_DESIGN_SYSTEM = {
  FOUNDATION,
  TYPOGRAPHY,
  SPACING,
  LAYOUT,
  APP_LAYOUT,
  EQUIPMENT_PLANNER: {
    HEADER: {
      BACKGROUND: COLORS.WHITE,
      BORDER: COLORS.GRAY_200,
      HEIGHT: '60px',
    },
    FOLDER: {
      BACKGROUND: COLORS.GRAY_50,
      BORDER: COLORS.GRAY_200,
    },
  },
  COMPONENTS: {
    EQUIPMENT_STATUS: {
      AVAILABLE: { BACKGROUND: COLORS.SUCCESS },
      BOOKED: { BACKGROUND: COLORS.WARNING },
      MAINTENANCE: { BACKGROUND: COLORS.ERROR },
      TRANSIT: { BACKGROUND: COLORS.INFO },
      WEEKEND: { BACKGROUND: COLORS.GRAY_100 },
    },
    CARD: {
      BACKGROUND: COLORS.GRAY_50,
      BORDER: COLORS.GRAY_200,
      SHADOW: LAYOUT.SHADOW.SM,
    }
  }
}