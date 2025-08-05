/**
 * 🎨 QUINCY DESIGN SYSTEM - UNIFIED
 * 
 * Works with your existing CSS variables and dark theme
 * Provides JavaScript access to design tokens for complex calculations
 */

import React from 'react';

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
  
  // Button patterns matching dashboard styling
  button: {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 transition-colors',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors',
    outline: 'border border-border bg-background hover:bg-muted/50 transition-colors',
    ghost: 'hover:bg-muted/50 hover:text-foreground transition-colors',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors'
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

/**
 * Create input styling with validation state
 */
export function createInputClasses(state: 'default' | 'withIcon' | 'error' | 'success' | 'disabled' = 'default'): string {
  return cn(
    'flex h-10 w-full rounded-md px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
    FORM_PATTERNS.input[state]
  );
}

/**
 * Create form field classes with consistent spacing
 */
export function createFieldClasses(layout: 'default' | 'group' | 'inline' = 'default'): string {
  return FORM_PATTERNS.field[layout];
}

/**
 * Create validation message classes
 */
export function createMessageClasses(type: 'error' | 'success' | 'info' | 'warning' = 'error'): string {
  return FORM_PATTERNS.message[type];
}

/**
 * Create enhanced form field with icon support
 */
export function createFormFieldContainer(hasIcon: boolean = false): string {
  return cn(
    FORM_PATTERNS.fieldContainer.default,
    hasIcon && FORM_PATTERNS.fieldContainer.floating
  );
}

/**
 * Create icon classes for form fields
 */
export function createFieldIconClasses(): string {
  return cn(
    FORM_PATTERNS.fieldIcon.position,
    FORM_PATTERNS.fieldIcon.size,
    FORM_PATTERNS.fieldIcon.color
  );
}

// Helper function to create currency input with kr symbol
export function createCurrencyInput(): { container: string; symbol: string; input: string } {
  return {
    container: FORM_PATTERNS.currency.container,
    symbol: FORM_PATTERNS.currency.symbol,
    input: FORM_PATTERNS.currency.input
  };
}

// Helper function to get Norwegian placeholders
export function getNorwegianPlaceholder(type: keyof typeof FORM_PATTERNS.placeholders): string {
  return FORM_PATTERNS.placeholders[type];
}

// Helper function to get a random legendary artist project name
export function getRandomLegendaryArtist(): string {
  const artists = FORM_PATTERNS.legendaryArtists;
  return artists[Math.floor(Math.random() * artists.length)];
}

// Helper function to create enhanced dropdown classes
export function createDropdownClasses(type: 'trigger' | 'triggerWithIcon' | 'content' | 'item' | 'itemSelected' | 'separator' | 'iconContainer' | 'iconInside'): string {
  return FORM_PATTERNS.dropdown[type];
}

/**
 * Get role color scheme based on role name
 * Falls back to primary color if role name not found
 */
export function getRoleColor(roleName: string): typeof ROLE_COLORS[keyof typeof ROLE_COLORS] {
  const colorKey = ROLE_COLOR_MAP[roleName] || 'primary';
  return ROLE_COLORS[colorKey];
}

/**
 * Get role badge classes for consistent styling
 * Replaces hardcoded database colors with design system colors
 */
export function getRoleBadgeClasses(roleName: string): string {
  const roleColor = getRoleColor(roleName);
  return cn('text-xs py-1 px-2 whitespace-nowrap flex-shrink-0', roleColor.classes);
}

/**
 * Get role badge style object for components that need inline styles
 * Provides fallback for gradual migration from database colors
 */
export function getRoleBadgeStyle(roleName: string): React.CSSProperties {
  const roleColor = getRoleColor(roleName);
  return (roleColor as any).style || { backgroundColor: roleColor.bg, color: roleColor.text };
}

// ========== FORM PATTERNS ==========
// Standardized form and dialog patterns for consistent UX

export const FORM_PATTERNS = {
  // Field containers and spacing
  field: {
    default: 'space-y-2',
    group: 'space-y-4',
    inline: 'flex items-center space-x-2'
  },
  
  // Input styling matching dashboard subtle patterns
  input: {
    default: 'bg-background border border-border text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 transition-colors',
    withIcon: 'bg-background border border-border text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 transition-colors pl-10',
    error: 'bg-background border border-destructive text-foreground placeholder:text-muted-foreground focus:border-destructive focus:ring-2 focus:ring-destructive/20 transition-colors',
    success: 'bg-background border border-green-500 text-foreground placeholder:text-muted-foreground focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-colors',
    disabled: 'bg-muted border border-border text-muted-foreground cursor-not-allowed'
  },
  
  // Label styling
  label: {
    default: 'text-sm font-medium text-foreground',
    required: 'text-sm font-medium text-foreground after:content-["*"] after:text-destructive after:ml-1',
    optional: 'text-sm font-medium text-muted-foreground'
  },
  
  // Validation message styling
  message: {
    error: 'text-sm font-medium text-destructive',
    success: 'text-sm font-medium text-green-600',
    info: 'text-sm text-muted-foreground',
    warning: 'text-sm font-medium text-orange-600'
  },
  
  // Dialog structure matching dashboard subtle aesthetic
  dialog: {
    container: 'bg-card text-card-foreground border border-border rounded-lg shadow-lg',
    header: 'border-b border-border pb-4 mb-6',
    content: 'space-y-4',
    footer: 'border-t border-border pt-4 mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 space-y-2 space-y-reverse sm:space-y-0',
    overlay: 'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
  },
  
  // Form layout patterns matching dashboard spacing
  layout: {
    singleColumn: 'space-y-4',
    twoColumn: 'grid grid-cols-1 md:grid-cols-2 gap-4',
    threeColumn: 'grid grid-cols-1 md:grid-cols-3 gap-4',
    fieldset: 'space-y-4 p-4 border border-border rounded-lg bg-muted/50'
  },
  
  // Field container styles with modern aesthetics
  fieldContainer: {
    default: 'relative',
    withIcon: 'relative flex items-center',
    floating: 'relative group'
  },
  
  // Icon positioning for form fields
  fieldIcon: {
    position: 'absolute left-3 top-1/2 -translate-y-1/2 z-10',
    size: 'h-4 w-4',
    color: 'text-muted-foreground group-focus-within:text-primary transition-colors'
  },
  
  // Currency input with NOK (kr) support
  currency: {
    container: 'relative',
    symbol: 'absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground pointer-events-none',
    input: 'pl-8 pr-3 py-2 h-10 w-full rounded-md border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
  },
  
  // Norwegian placeholders for common input types
  placeholders: {
    email: 'navn@firma.no',
    phone: '+47 123 45 678',
    name: 'Ola Nordmann',
    company: 'Bedrift AS',
    address: 'Karl Johans gate 1, 0154 Oslo'
  },
  
  // Enhanced dropdown styling for better UX
  dropdown: {
    trigger: 'h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
    triggerWithIcon: 'h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
    content: 'relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
    item: 'relative flex w-full cursor-default select-none items-center rounded-sm py-2 px-3 text-sm outline-none hover:bg-muted focus:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors',
    itemSelected: 'bg-primary/10 text-primary font-medium',
    separator: 'h-px bg-border my-1',
    iconContainer: 'relative inline-block w-full',
    iconInside: 'absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none'
  },
  
  // Legendary artists and bands for project inspiration
  legendaryArtists: [
    // Classic Legends
    'The Beatles',
    'Queen',
    'Led Zeppelin',
    'Pink Floyd',
    'The Rolling Stones',
    'David Bowie',
    'Prince',
    'Michael Jackson',
    'Bob Dylan',
    'Elvis Presley',
    'Johnny Cash',
    'The Who',
    'Fleetwood Mac',
    'ABBA',
    
    // Rock & Alternative Icons
    'Nirvana',
    'AC/DC',
    'Metallica',
    'Guns N\' Roses',
    'Pearl Jam',
    'Radiohead',
    'The Cure',
    'Depeche Mode',
    'U2',
    'Coldplay',
    'Foo Fighters',
    'Red Hot Chili Peppers',
    'Green Day',
    'Muse',
    'Arctic Monkeys',
    
    // Cult Bands & Underground Legends
    'Joy Division',
    'The Smiths',
    'Sonic Youth',
    'Pixies',
    'My Bloody Valentine',
    'The Velvet Underground',
    'Television',
    'Wire',
    'Gang of Four',
    'Bauhaus',
    'Dead Can Dance',
    'Cocteau Twins',
    'This Mortal Coil',
    'Swans',
    'Godspeed You! Black Emperor',
    'Mogwai',
    'Explosions in the Sky',
    'Boards of Canada',
    'Aphex Twin',
    'Autechre',
    'Squarepusher',
    'The Mars Volta',
    'At the Drive-In',
    'Fugazi',
    'Minor Threat',
    'Black Flag',
    'Bad Brains',
    'Dead Kennedys',
    'The Clash',
    'Sex Pistols',
    'Ramones',
    'Talking Heads',
    'Kraftwerk',
    'Can',
    'Neu!',
    'King Crimson',
    'Yes',
    'Genesis',
    'Jethro Tull',
    
    // Nordic/Icelandic Cult
    'Björk',
    'Sigur Rós',
    'Múm',
    'Ólafur Arnalds',
    'Nils Frahm',
    'Max Richter',
    
    // Modern Icons
    'Radiohead',
    'Arcade Fire',
    'The National',
    'Vampire Weekend',
    'Tame Impala',
    'Beach House',
    'Grizzly Bear',
    'Animal Collective',
    'Panda Bear',
    'Fleet Foxes',
    'Bon Iver',
    'Sufjan Stevens',
    'The Strokes',
    'Interpol',
    'Yeah Yeah Yeahs',
    'LCD Soundsystem',
    'Daft Punk',
    'Justice',
    'Chemical Brothers',
    'The Prodigy',
    'Massive Attack',
    'Portishead',
    'Tricky',
    'FKA twigs',
    'James Blake',
    'Thom Yorke',
    'Flying Lotus',
    'Burial',
    'Four Tet',
    
    // Hip-Hop Legends
    'Wu-Tang Clan',
    'A Tribe Called Quest',
    'De La Soul',
    'Public Enemy',
    'N.W.A',
    'OutKast',
    'Kanye West',
    'Kendrick Lamar',
    'Tyler, The Creator',
    'Frank Ocean',
    'MF DOOM',
    'Madlib',
    'J Dilla',
    
    // Pop Icons
    'Madonna',
    'Beyoncé',
    'Taylor Swift',
    'Adele',
    'Amy Winehouse',
    'Lana Del Rey',
    'The Weeknd',
    'Billie Eilish',
    'Lorde'
  ]
} as const;

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

// ========== ROLE BADGES ==========
// Standardized role badge colors using design system CSS variables

export const ROLE_COLORS = {
  // Primary roles - using brand colors
  primary: {
    bg: 'hsl(var(--primary))',           // Purple
    text: 'hsl(var(--primary-foreground))',
    classes: 'bg-primary text-primary-foreground border-0'
  },
  secondary: {
    bg: 'hsl(var(--secondary))',         // Deep purple
    text: 'hsl(var(--secondary-foreground))',
    classes: 'bg-secondary text-secondary-foreground border-0'
  },
  accent: {
    bg: 'hsl(var(--accent))',            // Orange
    text: 'hsl(var(--accent-foreground))',
    classes: 'bg-accent text-accent-foreground border-0'
  },
  
  // Extended palette for more role variety
  green: {
    bg: 'hsl(142 76% 36%)',             // Green-600
    text: 'hsl(0 0% 98%)',              // White
    classes: 'text-white border-0',
    style: { backgroundColor: 'hsl(142 76% 36%)' }
  },
  blue: {
    bg: 'hsl(221 83% 53%)',             // Blue-600
    text: 'hsl(0 0% 98%)',              // White
    classes: 'text-white border-0',
    style: { backgroundColor: 'hsl(221 83% 53%)' }
  },
  red: {
    bg: 'hsl(0 84% 60%)',               // Red-500
    text: 'hsl(0 0% 98%)',              // White
    classes: 'text-white border-0',
    style: { backgroundColor: 'hsl(0 84% 60%)' }
  },
  yellow: {
    bg: 'hsl(45 93% 47%)',              // Yellow-500
    text: 'hsl(0 0% 9%)',               // Near black
    classes: 'text-gray-900 border-0',
    style: { backgroundColor: 'hsl(45 93% 47%)' }
  },
  pink: {
    bg: 'hsl(330 81% 60%)',             // Pink-500
    text: 'hsl(0 0% 98%)',              // White
    classes: 'text-white border-0',
    style: { backgroundColor: 'hsl(330 81% 60%)' }
  },
  indigo: {
    bg: 'hsl(239 84% 67%)',             // Indigo-500
    text: 'hsl(0 0% 98%)',              // White
    classes: 'text-white border-0',
    style: { backgroundColor: 'hsl(239 84% 67%)' }
  },
  teal: {
    bg: 'hsl(173 80% 40%)',             // Teal-600
    text: 'hsl(0 0% 98%)',              // White
    classes: 'text-white border-0',
    style: { backgroundColor: 'hsl(173 80% 40%)' }
  }
} as const;

// Role name to color mapping - standardized across the app
export const ROLE_COLOR_MAP: Record<string, keyof typeof ROLE_COLORS> = {
  // Production roles
  'Producer': 'primary',
  'Director': 'secondary',
  'Stage Manager': 'accent',
  'Production Manager': 'primary',
  'Assistant Director': 'secondary',
  
  // Technical roles
  'Sound Engineer': 'blue',
  'Monitor Engineer': 'blue',
  'RF Technician': 'blue',
  'Audio Technician': 'blue',
  'FOH Engineer': 'blue',
  
  // Video/Lighting
  'Video Engineer': 'green',
  'Lighting Engineer': 'green',
  'Camera Operator': 'green',
  'Lighting Technician': 'green',
  'Video Technician': 'green',
  
  // Crew
  'Stagehand': 'teal',
  'Loader': 'teal',
  'Runner': 'teal',
  'Security': 'red',
  'Driver': 'yellow',
  
  // Creative
  'Artist': 'pink',
  'Musician': 'pink',
  'Performer': 'pink',
  
  // Other
  'Freelancer': 'indigo',
  'Consultant': 'indigo'
} as const;

// ========== LEGACY COMPATIBILITY ==========
// For existing components that import from design-system

export const QUINCY_DESIGN_SYSTEM = {
  THEME,
  COMPONENT_CLASSES,
  STATUS_PATTERNS,
  FORM_PATTERNS,
  SPACING,
  LAYOUT,
  RESPONSIVE,
  EQUIPMENT_STATUS,
  ROLE_COLORS,
  ROLE_COLOR_MAP
} as const;

// Default export for easier importing
export default QUINCY_DESIGN_SYSTEM;