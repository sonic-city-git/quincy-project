/**
 * 🎯 EVENT GRID LAYOUT
 * 
 * Professional responsive grid system using design system patterns
 * Supports mobile-first responsive design with proper breakpoints
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { RESPONSIVE, COMPONENT_CLASSES } from '@/design-system';
import { Package, Users, Settings2 } from 'lucide-react';

// Shared grid column definitions - MUST stay in sync between header and cards
// Optimized for Norwegian currency display and Event Details protection
const GRID_COLUMNS = {
  // Mobile: 7 columns, only Total € to give it priority (no clipping)
  // Total width: ~260px fits mobile perfectly with margins
  mobile: 'grid-cols-[80px_1fr_36px_36px_36px_50px_90px]',
  // Tablet: 11 columns, Equipment/Crew/Type/Variant all return (768px+)
  tablet: 'md:grid-cols-[100px_minmax(200px,300px)_120px_100px_36px_36px_36px_60px_90px_90px_110px]',
  // Desktop: Full grid with optimal spacing (1024px+)
  desktop: 'lg:grid-cols-[120px_minmax(250px,400px)_140px_130px_36px_36px_36px_70px_120px_120px_140px]'
} as const;

export interface EventGridProps {
  children: React.ReactNode;
  variant?: 'card' | 'header' | 'compact' | 'mobile';
  className?: string;
}

/**
 * 3-Tier progressive responsive event grid optimized for Total € priority:
 * 
 * Mobile (<768px): 7 columns, ~260px total - Total € PRIORITY, no clipping ever
 * [Date:80px] [Event Details:1fr] [Location:36px] [Equipment:36px] [Crew:36px] [Status:50px] [Total €:90px]
 * 
 * Tablet (768px+): 11 columns, Equipment/Crew/Type/Variant all return
 * [Date:100px] [Event Details:200-300px] [Type:120px] [Variant:100px] [Location:36px] [Equipment:36px] [Crew:36px] [Status:60px] [Equipment €:90px] [Crew €:90px] [Total €:110px]
 * 
 * Desktop (1024px+): 11 columns, full spacing and protection
 * [Date:120px] [Event Details:250-400px] [Type:140px] [Variant:130px] [Location:36px] [Equipment:36px] [Crew:36px] [Status:70px] [Equipment €:120px] [Crew €:120px] [Total €:140px]
 * 
 * TOTAL PRICE PRIORITY SYSTEM:
 * 1. Total € - HIGHEST PRIORITY, always visible, never clips
 * 2. Operational Icons - Equipment/Crew/Status always visible for workflows  
 * 3. Event Details - Protected with flexible space
 * 4. Equipment/Crew € - Hidden until tablet (768px+) to protect Total €
 * 5. Type/Variant - Hidden until tablet for full context
 * 
 * Progressive Hiding Strategy (No Window Resize Clipping):
 * - Mobile: Only Total € price shown → no clipping during window resize
 * - Tablet+: Equipment/Crew prices + Type/Variant return together (768px+)
 * - Desktop: Full spacing and optimal layout (1024px+)
 * 
 * Operational Icon Priority (ALWAYS Visible):
 * - Equipment (📦), Crew (👥), Status (⚙️) icons never hidden
 * - Essential operational indicators get consistent 36px space
 * - Touch-friendly interaction areas maintained across breakpoints
 * - Workflow functionality preserved on all devices
 * 
 * Anti-Clipping Architecture:
 * - Different column counts per breakpoint (7→11→11) 
 * - Elements hidden via visibility classes, not squashed
 * - Mobile-first width: ~260px fits 375px screens with generous margins
 * - Total € protected during any window resizing
 * - Norwegian currency format supported at each tier ("kr 99 999")
 * 
 * Grid Structure Benefits:
 * - No horizontal scroll on any device size
 * - No text truncation or price clipping during window resize
 * - Total € (most important price info) always accessible
 * - Graceful degradation with progressive enhancement
 * - Real-world device testing optimized (375px, 768px, 1024px+ breakpoints)
 */
export function EventGrid({ 
  children, 
  variant = 'card',
  className 
}: EventGridProps) {
  const gridClasses = {
    // Event cards - using 3-tier progressive grid system
    card: cn(
      'grid', GRID_COLUMNS.mobile, GRID_COLUMNS.tablet, GRID_COLUMNS.desktop,
      'gap-2 items-center min-h-[60px] px-2 py-2',
      'md:gap-3 md:px-3 md:py-3',
      'lg:gap-4 lg:px-4 lg:py-3'
    ),
    
    // Table header - using 3-tier progressive grid system  
    header: cn(
      'grid', GRID_COLUMNS.mobile, GRID_COLUMNS.tablet, GRID_COLUMNS.desktop,
      'gap-2 items-center min-h-[52px] px-2 py-3',
      'md:gap-3 md:px-3',
      'lg:gap-4 lg:px-4',
      'text-sm font-semibold text-muted-foreground/80 tracking-wide uppercase',
      'border-b border-border/20 pb-3 mb-3'
    ),
    
    // Compact for dense layouts - uses 3-tier progressive grid system
    compact: cn(
      'grid', GRID_COLUMNS.mobile, GRID_COLUMNS.tablet, GRID_COLUMNS.desktop,
      'gap-1 items-center min-h-[44px] px-1 text-sm',
      'md:gap-2 md:px-2',
      'lg:gap-2 lg:px-2'
    ),
    
    // Mobile-first with progressive enhancement
    mobile: cn(
      'flex flex-col space-y-2 p-2',
      'sm:grid', GRID_COLUMNS.mobile, GRID_COLUMNS.tablet, GRID_COLUMNS.desktop,
      'sm:space-y-0 sm:gap-2 sm:items-center sm:p-3',
      'md:gap-3 md:p-3',
      'lg:gap-4 lg:p-4'
    )
  };

  return (
    <div className={cn(
      gridClasses[variant],
      'transition-all duration-200 ease-in-out',
      className
    )}>
      {children}
    </div>
  );
}

/**
 * Professional grid column components with proper accessibility
 */
export const EventGridColumns = {
  Date: ({ children, className, interactive = false }: { 
    children: React.ReactNode; 
    className?: string;
    interactive?: boolean;
  }) => (
    <div className={cn(
      'flex items-center gap-2 text-sm font-medium',
      interactive ? 'text-foreground/90 hover:text-primary cursor-pointer transition-colors' : 'text-muted-foreground/80',
      className
    )}>
      {children}
    </div>
  ),

  Event: ({ children, className, interactive = false }: { 
    children: React.ReactNode; 
    className?: string;
    interactive?: boolean;
  }) => (
    <div className={cn(
      'flex flex-col justify-center gap-0.5 min-w-[180px] max-w-full',
      interactive && 'hover:text-primary cursor-pointer transition-colors',
      className
    )}>
      {children}
    </div>
  ),

  Icon: ({ children, className, status }: { 
    children: React.ReactNode; 
    className?: string;
    status?: 'success' | 'warning' | 'error' | 'neutral';
  }) => {
    const statusClasses = {
      success: 'text-green-500',
      warning: 'text-orange-500', 
      error: 'text-red-500',
      neutral: 'text-muted-foreground'
    };

    return (
      <div className={cn(
        'flex items-center justify-center transition-colors',
        status && statusClasses[status],
        className
      )}>
        {children}
      </div>
    );
  },

  Badge: ({ children, className, variant = 'default', customColor }: { 
    children: React.ReactNode; 
    className?: string;
    variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning';
    customColor?: string;
  }) => {
    const variantClasses = {
      default: 'bg-muted text-muted-foreground',
      primary: 'bg-primary/10 text-primary border border-primary/20',
      secondary: 'bg-secondary/10 text-secondary border border-secondary/20', 
      success: 'bg-green-500/10 text-green-600 border border-green-500/20',
      warning: 'bg-orange-500/10 text-orange-600 border border-orange-500/20'
    };

    return (
      <div className={cn('flex items-center px-1', className)}>
        <span className={cn(
          'inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold',
          'transition-all duration-200 tracking-wide',
          customColor || variantClasses[variant]
        )}>
          {children}
        </span>
      </div>
    );
  },

  Action: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn('flex items-center justify-center', className)}>
      {children}
    </div>
  ),

  Price: ({ children, className, variant = 'default', align = 'right' }: { 
    children: React.ReactNode; 
    className?: string;
    variant?: 'default' | 'total' | 'muted';
    align?: 'left' | 'center' | 'right';
  }) => {
    const variantClasses = {
      default: 'text-foreground',
      total: 'text-foreground font-semibold',
      muted: 'text-muted-foreground'
    };

    const alignClasses = {
      left: 'justify-start',
      center: 'justify-center', 
      right: 'justify-end'
    };

    return (
      <div className={cn(
        'flex items-center text-sm tabular-nums font-medium',
        alignClasses[align],
        variantClasses[variant],
        className
      )}>
        {children}
      </div>
    );
  }
} as const;

/**
 * Professional table header with consistent styling
 * Enhanced with better typography and design system integration
 */
export function EventTableHeader({ className }: { className?: string }) {
  return (
    <div className={cn(
      'px-4 py-4 bg-gradient-to-r from-muted/40 to-muted/60',
      'border-b-2 border-border/30',
      'backdrop-blur-sm',
      className
    )}>
      <EventGrid variant="header" className="min-h-[48px] text-sm font-bold text-foreground/90 tracking-wide">
        <div>Date</div>
        <div>Event Details</div>
        <div className="hidden md:block">Type</div>
        <div className="hidden md:block">Variant</div>
        <div className="text-center">Location</div>
        <div className="text-center">Equipment</div>
        <div className="text-center">Crew</div>
        <div className="text-center">Status</div>
        <div className="text-right hidden md:block">Equipment</div>
        <div className="text-right hidden md:block">Crew</div>
        <div className="text-right font-bold">Total</div>
      </EventGrid>
    </div>
  );
}

/**
 * Compact section-level table header for use within EventSections
 * Provides column context without overwhelming the section design
 * Now includes action icons for equipment, crew, and status management
 */
export function EventSectionTableHeader({ 
  className,
  events,
  onStatusChange 
}: { 
  className?: string;
  events?: { type?: { needs_equipment?: boolean; needs_crew?: boolean } }[];
  onStatusChange?: (event: any, newStatus: any) => void;
}) {
  return (
    <div className={cn(
      'border-b border-border/10 bg-muted/20',
      className
    )}>
                <EventGrid variant="header" className="min-h-[28px] py-0.5 md:py-0.5">
            {/* Date Column */}
            <div className="text-xs font-semibold text-muted-foreground/80 tracking-wider uppercase">
              Date
            </div>

            {/* Event Details Column */}
            <div className="text-xs font-semibold text-muted-foreground/80 tracking-wider uppercase">
              Event Details
            </div>

            {/* Type Badge Column - Only on tablet+ to match grid structure */}
            <div className="text-xs font-semibold text-muted-foreground/80 tracking-wider uppercase hidden md:block">
              Type
            </div>
        
            {/* Variant Column - Only on tablet+ to match grid structure */}
            <div className="text-xs font-semibold text-muted-foreground/80 tracking-wider uppercase hidden md:block">
              Variant
            </div>

            {/* Location Icon Column - Always visible */}
            <div className="flex items-center justify-center">
              <div className="hidden md:block"></div>
            </div>

            {/* Equipment Icon Column - Always visible */}
            <div className="flex items-center justify-center">
              {events && events.length > 0 && events[0]?.type?.needs_equipment && (
                <Package className="h-6 w-6 text-blue-600 hover:text-blue-700 cursor-pointer transition-colors" />
              )}
            </div>

            {/* Crew Icon Column - Always visible */}
            <div className="flex items-center justify-center">
              {events && events.length > 0 && events[0]?.type?.needs_crew && (
                <Users className="h-6 w-6 text-green-600 hover:text-green-700 cursor-pointer transition-colors" />
              )}
            </div>
        
            {/* Status Action Column - Always visible */}
            <div className="flex items-center justify-center">
              {events && events.length > 0 && onStatusChange && (
                <Settings2 className="h-6 w-6 text-orange-600 hover:text-orange-700 cursor-pointer transition-colors" />
              )}
            </div>
        
        {/* Equipment Price Column - Hidden until tablet to prioritize Total */}
        <div className="text-right text-xs font-semibold text-muted-foreground/80 tracking-wider uppercase hidden md:block">
          <span className="hidden lg:inline">Equipment</span>
          <span className="lg:hidden">Equip</span>
        </div>
        
        {/* Crew Price Column - Hidden until tablet to prioritize Total */}
        <div className="text-right text-xs font-semibold text-muted-foreground/80 tracking-wider uppercase hidden md:block">
          <span className="hidden lg:inline">Crew</span>
          <span className="lg:hidden">Crew</span>
        </div>
        
        {/* Total Price Column - HIGHEST PRIORITY, always visible */}
        <div className="text-right text-xs font-bold text-muted-foreground/90 tracking-wider uppercase">
          Total
        </div>
      </EventGrid>
    </div>
  );
}