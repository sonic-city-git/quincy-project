/**
 * 🎨 QUINCY DESIGN SYSTEM - UNIFIED
 * 
 * Works with your existing CSS variables and dark theme
 * Provides JavaScript access to design tokens for complex calculations
 */

// ========== CSS VARIABLE REFERENCES ==========
// These reference your actual CSS variables from index.css

export const CSS_VARS = {
  // Core theme colors (from your index.css)
  background: 'hsl(var(--background))',           // Dark background
  foreground: 'hsl(var(--foreground))',           // Text color
  card: 'hsl(var(--card))',                       // Card background
  cardForeground: 'hsl(var(--card-foreground))', // Card text
  
  // Your brand colors
  primary: 'hsl(var(--primary))',                 // Purple #9b87f5
  primaryForeground: 'hsl(var(--primary-foreground))',
  secondary: 'hsl(var(--secondary))',             // Deep purple #7E69AB
  secondaryForeground: 'hsl(var(--secondary-foreground))',
  accent: 'hsl(var(--accent))',                   // Orange #F97316
  accentForeground: 'hsl(var(--accent-foreground))',
  
  // UI colors
  muted: 'hsl(var(--muted))',                     // Zinc-800 equivalent
  mutedForeground: 'hsl(var(--muted-foreground))', // Muted text
  border: 'hsl(var(--border))',                   // Border color
  input: 'hsl(var(--input))',                     // Input background
  ring: 'hsl(var(--ring))',                       // Focus ring
  
  // Status colors
  destructive: 'hsl(var(--destructive))',         // Error red
  destructiveForeground: 'hsl(var(--destructive-foreground))',
  
  // Business status colors (mapped to design system)
  success: 'hsl(var(--secondary))',    // Secondary purple - completed/invoiced
  warning: 'hsl(var(--accent))',       // Primary accent orange - action needed  
  info: 'hsl(var(--primary))',         // Primary purple - active/in progress
  neutral: 'hsl(var(--primary))',      // Primary purple - planning/neutral
  danger: 'hsl(var(--destructive))'    // Destructive red - urgent/overdue
} as const;

// ========== SEMANTIC COLOR MAPPING ==========
// Map your CSS variables to semantic names for easier use

export const THEME = {
  // Backgrounds (using your actual variables)
  bg: {
    primary: CSS_VARS.background,      // Main app background
    secondary: CSS_VARS.card,          // Card backgrounds
    muted: CSS_VARS.muted,            // Subtle backgrounds
    input: CSS_VARS.input             // Input backgrounds
  },
  
  // Text colors
  text: {
    primary: CSS_VARS.foreground,      // Main text
    secondary: CSS_VARS.mutedForeground, // Muted text
    muted: CSS_VARS.mutedForeground,   // Very muted text
    inverse: CSS_VARS.primaryForeground // Dark text on light bg
  },
  
  // Interactive colors (your brand)
  interactive: {
    primary: CSS_VARS.primary,         // Purple buttons
    secondary: CSS_VARS.secondary,     // Deep purple
    accent: CSS_VARS.accent,           // Orange accent
    destructive: CSS_VARS.destructive  // Error/delete
  },
  
  // Borders
  border: {
    default: CSS_VARS.border,          // Main borders
    input: CSS_VARS.border,            // Input borders
    focus: CSS_VARS.ring              // Focus borders
  }
} as const;

// ========== CONSISTENT CLASS BUILDERS ==========
// Build consistent classes using your theme

export const COMPONENT_CLASSES = {
  // Card patterns (matches your dashboard)
  card: {
    default: 'bg-card text-card-foreground border border-border rounded-lg shadow-sm',
    subtle: 'bg-muted/50 text-card-foreground border border-border/50 rounded-lg',
    hover: 'bg-card text-card-foreground border border-border rounded-lg shadow-sm hover:bg-muted/30 transition-colors'
  },
  
  // Button patterns (using your CSS variables)
  button: {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 transition-colors',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors',
    outline: 'border border-border bg-background hover:bg-muted/50 transition-colors',
    ghost: 'hover:bg-muted/50 hover:text-foreground transition-colors'
  },
  
  // Input patterns
  input: {
    default: 'bg-input border border-border text-foreground placeholder:text-muted-foreground focus:border-ring transition-colors',
    filter: 'bg-muted/50 border border-border/50 text-muted-foreground hover:text-foreground transition-colors'
  },
  
  // Table patterns (matches your current style)
  table: {
    container: 'border border-border rounded-lg overflow-hidden',
    header: 'bg-muted/50 border-b border-border',
    row: 'border-b border-border/50 hover:bg-muted/30 transition-colors',
    cell: 'p-4 text-sm'
  }
} as const;

// ========== STATUS PATTERNS ==========
// Consistent status styling (like your StatusCard)

export const STATUS_PATTERNS = {
  critical: {
    bg: 'bg-gradient-to-br from-red-50/10 to-red-100/10',
    border: 'border-red-200/20',
    text: 'text-red-500',
    accent: 'bg-gradient-to-r from-red-500 to-red-600'
  },
  warning: {
    bg: 'bg-gradient-to-br from-orange-50/10 to-orange-100/10',
    border: 'border-orange-200/20',
    text: 'text-orange-500',
    accent: 'bg-gradient-to-r from-orange-500 to-orange-600'
  },
  success: {
    bg: 'bg-gradient-to-br from-green-50/10 to-green-100/10',
    border: 'border-green-200/20',
    text: 'text-green-500',
    accent: 'bg-gradient-to-r from-green-500 to-green-600'
  },
  info: {
    bg: 'bg-gradient-to-br from-blue-50/10 to-blue-100/10',
    border: 'border-blue-200/20',
    text: 'text-blue-500',
    accent: 'bg-gradient-to-r from-blue-500 to-blue-600'
  },
  operational: {
    bg: 'bg-gradient-to-br from-slate-50/10 to-slate-100/10',
    border: 'border-slate-200/20',
    text: 'text-slate-500',
    accent: 'bg-gradient-to-r from-slate-500 to-slate-600'
  }
} as const;

// ========== SPACING & LAYOUT ==========
// Consistent spacing using Tailwind's scale

export const SPACING = {
  xs: '0.5rem',    // 8px
  sm: '0.75rem',   // 12px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem'    // 64px
} as const;

export const LAYOUT = {
  borderRadius: {
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px - your default
    lg: '0.75rem',   // 12px
    xl: '1rem'       // 16px
  },
  
  shadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
  },
  
  zIndex: {
    dropdown: 10,
    header: 20,
    modal: 50,
    toast: 100
  }
} as const;

// ========== UTILITY FUNCTIONS ==========

/**
 * Build component classes easily
 */
export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Create card with consistent styling
 */
export function createCard(variant: keyof typeof COMPONENT_CLASSES.card = 'default'): string {
  return COMPONENT_CLASSES.card[variant];
}

/**
 * Create button with consistent styling
 */
export function createButton(variant: keyof typeof COMPONENT_CLASSES.button = 'primary'): string {
  return COMPONENT_CLASSES.button[variant];
}

/**
 * Create status styling
 */
export function createStatus(status: keyof typeof STATUS_PATTERNS): string {
  const pattern = STATUS_PATTERNS[status];
  return cn(pattern.bg, pattern.border, pattern.text);
}

// ========== RESPONSIVE HELPERS ==========

export const RESPONSIVE = {
  grid: {
    cards: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
    stats: 'grid grid-cols-2 md:grid-cols-4 gap-3',
    table: 'overflow-x-auto'
  },
  
  flex: {
    header: 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4',
    actions: 'flex flex-col sm:flex-row gap-2'
  },
  
  spacing: {
    section: 'space-y-4 md:space-y-6',
    items: 'space-y-2 md:space-y-3'
  }
} as const;

// ========== EQUIPMENT/DOMAIN SPECIFIC ==========
// Keep your domain-specific styling

export const EQUIPMENT_STATUS = {
  available: 'bg-green-500/10 text-green-500 border-green-500/20',
  booked: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  maintenance: 'bg-red-500/10 text-red-500 border-red-500/20',
  transit: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
} as const;

// ========== LEGACY COMPATIBILITY ==========
// For existing components that import from design-system

export const QUINCY_DESIGN_SYSTEM = {
  THEME,
  COMPONENT_CLASSES,
  STATUS_PATTERNS,
  SPACING,
  LAYOUT,
  RESPONSIVE,
  EQUIPMENT_STATUS
} as const;

// Default export for easier importing
export default QUINCY_DESIGN_SYSTEM;