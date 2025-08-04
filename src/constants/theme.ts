/**
 * 🎨 SIMPLIFIED THEME CONSTANTS
 * 
 * Simple utility classes that work with your CSS variables
 * Use these for consistent styling patterns
 */

// ========== SIMPLIFIED PATTERNS ==========
// Use CSS variables instead of hardcoded colors

export const BORDERS = {
  default: 'border-border',
  subtle: 'border-border/50',
  hover: 'hover:border-border/80',
  focus: 'focus:border-ring',
  input: 'border-input'
} as const;

export const BACKGROUNDS = {
  // Use CSS variables for consistency
  card: 'bg-card',
  cardSubtle: 'bg-muted/50',
  cardHover: 'hover:bg-muted/30',
  
  surface: 'bg-background',
  input: 'bg-input',
  inputHover: 'hover:bg-muted',
  
  header: 'bg-card',
  headerSubtle: 'bg-muted/50'
} as const;

// ========== TEXT PATTERNS ==========
export const TEXT = {
  // Primary text
  primary: 'text-foreground',
  secondary: 'text-muted-foreground',
  subtle: 'text-muted-foreground/60',
  
  // Interactive text
  link: 'text-blue-500 hover:text-blue-400',
  linkHover: 'hover:text-foreground',
  
  // Contextual text
  success: 'text-green-500',
  warning: 'text-orange-500',
  error: 'text-red-500',
  info: 'text-blue-500'
} as const;

// ========== TRANSITION PATTERNS ==========
export const TRANSITIONS = {
  // Standard transitions
  default: 'transition-colors duration-200',
  fast: 'transition-colors duration-150',
  slow: 'transition-colors duration-300',
  
  // Complex transitions
  all: 'transition-all duration-200',
  shadow: 'transition-shadow duration-200',
  transform: 'transition-transform duration-200'
} as const;

// ========== SHADOW PATTERNS ==========
export const SHADOWS = {
  // Card shadows
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  
  // Hover shadows
  hover: 'hover:shadow-md',
  hoverLg: 'hover:shadow-lg',
  
  // Ring shadows
  focus: 'focus:ring-2 focus:ring-primary/20',
  error: 'ring-2 ring-red-500/20'
} as const;

// ========== SPACING PATTERNS ==========
export const SPACING = {
  // Content spacing
  section: 'space-y-6',
  subsection: 'space-y-4',
  items: 'space-y-3',
  
  // Grid gaps
  gridSm: 'gap-3',
  gridMd: 'gap-4',
  gridLg: 'gap-6',
  
  // Padding patterns
  cardPadding: 'p-4',
  compactPadding: 'p-3',
  headerPadding: 'px-4 py-3'
} as const;

export const COMPONENT_VARIANTS = {
  // Button variants using CSS variables
  ghost: 'bg-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground',
  outline: 'border border-border bg-transparent hover:bg-muted/50',
  
  // Input variants
  filter: 'bg-muted/50 border-border/50 text-muted-foreground hover:text-foreground',
  
  // Status variants
  statusSuccess: 'bg-green-500/10 text-green-500 border-green-500/20',
  statusWarning: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  statusError: 'bg-red-500/10 text-red-500 border-red-500/20',
  statusInfo: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
} as const;

// ========== LAYOUT CONSTANTS ==========
export const LAYOUT = {
  // Container widths
  containerSm: 'max-w-4xl mx-auto',
  containerMd: 'max-w-6xl mx-auto',
  containerLg: 'max-w-7xl mx-auto',
  
  // Header heights
  navHeight: 'h-16',
  pageHeaderHeight: 'h-20',
  sectionHeaderHeight: 'h-12',
  
  // Z-index layers
  zNavigation: 'z-50',
  zHeader: 'z-20',
  zDropdown: 'z-30',
  zModal: 'z-50'
} as const;

// ========== RESPONSIVE PATTERNS ==========
export const RESPONSIVE = {
  // Grid patterns
  cardGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  statsGrid: 'grid grid-cols-2 md:grid-cols-4',
  tableGrid: 'overflow-x-auto',
  
  // Flex patterns
  headerFlex: 'flex flex-col sm:flex-row sm:items-center sm:justify-between',
  buttonGroup: 'flex flex-col sm:flex-row',
  
  // Responsive spacing
  sectionSpacing: 'space-y-4 md:space-y-6',
  itemSpacing: 'space-y-2 md:space-y-3'
} as const;

// ========== UTILITY FUNCTIONS ==========

/**
 * Combines multiple theme classes safely
 */
export function combineClasses(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Creates consistent card styling
 */
export function createCardClasses(variant: 'default' | 'subtle' | 'bordered' = 'default'): string {
  const base = `${TRANSITIONS.default} ${SHADOWS.hover}`;
  
  switch (variant) {
    case 'subtle':
      return combineClasses(base, BACKGROUNDS.cardSubtle, BORDERS.subtle);
    case 'bordered':
      return combineClasses(base, BACKGROUNDS.card, BORDERS.default);
    default:
      return combineClasses(base, BACKGROUNDS.card, BORDERS.default);
  }
}

/**
 * Creates consistent button styling
 */
export function createButtonClasses(variant: 'default' | 'ghost' | 'outline' = 'default'): string {
  const base = TRANSITIONS.default;
  
  switch (variant) {
    case 'ghost':
      return combineClasses(base, COMPONENT_VARIANTS.ghost);
    case 'outline':
      return combineClasses(base, COMPONENT_VARIANTS.outline);
    default:
      return base;
  }
}

/**
 * Creates consistent table styling
 */
export function createTableClasses(variant: 'default' | 'bordered' | 'minimal' = 'default') {
  switch (variant) {
    case 'bordered':
      return {
        container: combineClasses('rounded-lg overflow-hidden', BORDERS.default),
        header: combineClasses(BACKGROUNDS.header, BORDERS.default, 'border-b'),
        row: combineClasses(BORDERS.subtle, 'border-b', BACKGROUNDS.cardHover, TRANSITIONS.default)
      };
    case 'minimal':
      return {
        container: '',
        header: combineClasses(BORDERS.subtle, 'border-b'),
        row: combineClasses(BACKGROUNDS.hover, TRANSITIONS.default)
      };
    default:
      return {
        container: combineClasses('rounded-lg overflow-hidden', BORDERS.default),
        header: combineClasses(BACKGROUNDS.headerSubtle, BORDERS.default, 'border-b'),
        row: combineClasses(BORDERS.subtle, 'border-b', BACKGROUNDS.cardHover, TRANSITIONS.default)
      };
  }
}