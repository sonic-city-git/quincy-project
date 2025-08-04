/**
 * STANDARDIZED STATUS COLOR SYSTEM
 * 
 * This is our app-wide standard for conveying status information.
 * Use these colors consistently across all components that need to show status.
 */

import { THEME } from "@/design-system";

export type StatusLevel = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

export interface StatusColorScheme {
  name: string;
  level: StatusLevel;
  background: string;
  text: string;
  accent: string;
  description: string;
}

/**
 * Standardized status colors - use these across the entire app
 * Using design system CSS variables for consistency
 */
export const STANDARD_STATUS_COLORS: Record<StatusLevel, StatusColorScheme> = {
  neutral: {
    name: 'Neutral',
    level: 'neutral',
    background: 'hsl(var(--primary) / 0.6)', // BOLD primary purple
    text: 'hsl(var(--foreground))',
    accent: 'hsl(var(--primary))',
    description: 'Planning, draft, or neutral state'
  },
  
  info: {
    name: 'Info',
    level: 'info', 
    background: 'hsl(var(--primary) / 0.8)', // VIBRANT primary purple
    text: 'hsl(var(--foreground))',
    accent: 'hsl(var(--primary))',
    description: 'Active, in progress, or informational'
  },
  
  warning: {
    name: 'Warning',
    level: 'warning',
    background: 'hsl(var(--accent) / 0.85)', // STRONG accent orange
    text: 'hsl(var(--foreground))',
    accent: 'hsl(var(--accent))',
    description: 'Attention needed, action required'
  },
  
  success: {
    name: 'Success',
    level: 'success',
    background: 'hsl(var(--secondary) / 0.7)', // PROMINENT secondary purple
    text: 'hsl(var(--foreground))',
    accent: 'hsl(var(--secondary))',
    description: 'Completed, successful, positive state'
  },
  
  danger: {
    name: 'Danger',
    level: 'danger',
    background: 'hsl(var(--accent) / 0.9)', // MAXIMUM accent orange
    text: 'hsl(var(--foreground))',
    accent: 'hsl(var(--destructive))',
    description: 'Urgent, error, critical attention needed'
  }
};

/**
 * Maps business concepts to standard status levels
 */
export const BUSINESS_STATUS_MAPPING = {
  // Project statuses
  planning: 'neutral' as StatusLevel,
  active: 'info' as StatusLevel,
  invoiceReady: 'warning' as StatusLevel,
  invoiced: 'success' as StatusLevel,
  overdue: 'danger' as StatusLevel,
  
  // Event statuses  
  proposed: 'neutral' as StatusLevel,
  confirmed: 'info' as StatusLevel,
  completed: 'success' as StatusLevel,
  cancelled: 'neutral' as StatusLevel,
  
  // Equipment statuses
  available: 'success' as StatusLevel,
  inUse: 'info' as StatusLevel,
  maintenance: 'warning' as StatusLevel,
  unavailable: 'danger' as StatusLevel,
  
  // Crew statuses
  available: 'success' as StatusLevel,
  busy: 'info' as StatusLevel,
  conflict: 'warning' as StatusLevel,
  unavailable: 'danger' as StatusLevel
} as const;

/**
 * Get standardized status styles
 */
export function getStandardStatusStyles(level: StatusLevel): React.CSSProperties {
  const scheme = STANDARD_STATUS_COLORS[level];
  return {
    backgroundColor: scheme.background,
    color: scheme.text,
    border: `1px solid hsl(var(--border))`
  };
}

/**
 * Get status accent color for borders/highlights
 */
export function getStandardStatusAccent(level: StatusLevel): string {
  return STANDARD_STATUS_COLORS[level].accent;
}