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
  // Mobile: 6 columns - Core essentials only [Date, Details, Equipment, Crew, Status, Total]
  mobile: 'grid-cols-[58px_minmax(85px,145px)_28px_28px_38px_68px]',
  // Small: 7 columns - Add Type [Date, Details, Type, Equipment, Crew, Status, Total] 
  small: 'sm:grid-cols-[64px_minmax(105px,165px)_78px_30px_30px_42px_72px]',
  // Tablet: 8 columns - Add Variant [Date, Details, Type, Variant, Equipment, Crew, Status, Total]
  tablet: 'md:grid-cols-[70px_minmax(125px,185px)_86px_76px_32px_32px_46px_76px]',
  // Desktop: 9 columns - Add Crew € [Date, Details, Type, Variant, Equipment, Crew, Status, Crew €, Total]
  desktop: 'lg:grid-cols-[76px_minmax(145px,205px)_92px_82px_34px_34px_50px_74px_82px]',
  // Wide: 10 columns - Add Equipment € [Date, Details, Type, Variant, Equipment, Crew, Status, Equipment €, Crew €, Total]
  wide: 'xl:grid-cols-[82px_minmax(165px,225px)_98px_88px_36px_36px_54px_78px_78px_88px]'
} as const;

export interface EventGridProps {
  children: React.ReactNode;
  variant?: 'card' | 'header' | 'compact' | 'mobile';
  className?: string;
}

/**
 * 5-Tier ULTRA-COMPACT responsive event grid - Maximum density optimization:
 * 
 * Mobile (<640px): 6 columns - Core essentials only
 * [Date:58px] [Event Details:85-145px] [Equipment:28px] [Crew:28px] [Status:38px] [Total €:68px]
 * 
 * Small (640px+): 7 columns - Add Type column
 * [Date:64px] [Event Details:105-165px] [Type:78px] [Equipment:30px] [Crew:30px] [Status:42px] [Total €:72px]
 * 
 * Tablet (768px+): 8 columns - Add Variant column  
 * [Date:70px] [Event Details:125-185px] [Type:86px] [Variant:76px] [Equipment:32px] [Crew:32px] [Status:46px] [Total €:76px]
 * 
 * Desktop (1024px+): 9 columns - Add Crew € column
 * [Date:76px] [Event Details:145-205px] [Type:92px] [Variant:82px] [Equipment:34px] [Crew:34px] [Status:50px] [Crew €:74px] [Total €:82px]
 * 
 * Wide (1280px+): 10 columns - Add Equipment € column (full grid)
 * [Date:82px] [Event Details:165-225px] [Type:98px] [Variant:88px] [Equipment:36px] [Crew:36px] [Status:54px] [Equipment €:78px] [Crew €:78px] [Total €:88px]
 * 
 * PROGRESSIVE COLUMN ADDITION SYSTEM:
 * **Mobile (6 cols)**: Date, Event Details, Equipment Icon, Crew Icon, Status, Total € - Core essentials
 * **Small+ (7 cols)**: Add Type Badge - Context information  
 * **Tablet+ (8 cols)**: Add Variant - Additional context
 * **Desktop+ (9 cols)**: Add Crew € Price - Financial detail
 * **Wide+ (10 cols)**: Add Equipment € Price - Full financial breakdown
 * **CORE COLUMNS**: Never removed regardless of screen size
 * 
 * Container-Aware Ultra-Compact Architecture:
 * - Card height: 64px → 36px (44% reduction)
 * - Header height: 48px → 32px (33% reduction)
 * - Mobile padding: 67% reduction (px-1.5 py-1)
 * - Gap scaling: 0.5px → 2.5px fluid progression
 * - **CONTROLLED WIDTH**: Event Details use minmax(80px-220px, max) for controlled expansion
 * - No more excessive width - Event Details column has sensible max widths
 * - Typography: xs → sm fluid scaling
 * - Breakpoints: 0px, 640px, 768px, 1024px, 1280px (full spectrum)
 * 
 * Mathematically Perfect Ultra-Compact Scaling + Progressive Column Addition:
 * - **Date Column**: 58→64→70→76→82px (+6px linear progression) - CORE (Always visible)
 * - **Event Details**: minmax(85→165px, 145→225px) controlled expansion - CORE (Always visible)
 * - **Icon Columns**: 28→30→32→34→36px (+2px smooth scaling) - CORE (Always visible)
 * - **Status Column**: 38→42→46→50→54px (+4px balanced growth) - CORE (Always visible)
 * - **Total €**: 68→72→76→82→88px - CORE (Always visible, HIGHEST PRIORITY)
 * - **Type**: 78→86→92→98px - PROGRESSIVE (sm+ only, 7th column)
 * - **Variant**: 76→82→88px - PROGRESSIVE (md+ only, 8th column)
 * - **Crew €**: 74→82px - PROGRESSIVE (lg+ only, 9th column)
 * - **Equipment €**: 78→88px - PROGRESSIVE (xl+ only, 10th column)
 * - **Typography**: Consistent text-xs for maximum density
 * - **Grid Structure**: 6→7→8→9→10 columns (true progressive enhancement)
 */
export function EventGrid({ 
  children, 
  variant = 'card',
  className 
}: EventGridProps) {
  const gridClasses = {
    // Event cards - mathematically optimized 5-tier progressive system
    card: cn(
      'grid', GRID_COLUMNS.mobile, GRID_COLUMNS.small, GRID_COLUMNS.tablet, GRID_COLUMNS.desktop, GRID_COLUMNS.wide,
      'gap-0.5 items-center min-h-[36px] px-1.5 py-1',
      'sm:gap-1 sm:px-2 sm:py-1.5',
      'md:gap-1.5 md:px-2.5 md:py-2',
      'lg:gap-2 lg:px-3 lg:py-2.5',
      'xl:gap-2.5 xl:px-3.5 xl:py-3'
    ),
    
    // Table header - mathematically optimized 5-tier progressive system
    header: cn(
      'grid', GRID_COLUMNS.mobile, GRID_COLUMNS.small, GRID_COLUMNS.tablet, GRID_COLUMNS.desktop, GRID_COLUMNS.wide,
      'gap-0.5 items-center min-h-[32px] px-1.5 py-1.5',
      'sm:gap-1 sm:px-2 sm:py-2',
      'md:gap-1.5 md:px-2.5 md:py-2.5',
      'lg:gap-2 lg:px-3 lg:py-3',
      'xl:gap-2.5 xl:px-3.5 xl:py-3.5',
      'text-xs font-semibold text-muted-foreground/80 tracking-wide uppercase',
      'sm:text-sm',
      'border-b border-border/20 pb-1.5 mb-1.5'
    ),
    
    // Ultra-compact for dense layouts - optimized progression
    compact: cn(
      'grid', GRID_COLUMNS.mobile, GRID_COLUMNS.small, GRID_COLUMNS.tablet, GRID_COLUMNS.desktop, GRID_COLUMNS.wide,
      'gap-0 items-center min-h-[28px] px-1 py-0.5 text-xs',
      'sm:gap-0.5 sm:px-1.5 sm:py-1 sm:text-sm',
      'md:gap-1 md:px-2 md:py-1.5',
      'lg:gap-1.5 lg:px-2.5 lg:py-2',
      'xl:gap-2 xl:px-3 xl:py-2.5'
    ),
    
    // Mobile-first with mathematically optimized enhancement
    mobile: cn(
      'flex flex-col space-y-1.5 p-2',
      'sm:grid', GRID_COLUMNS.mobile, GRID_COLUMNS.small, GRID_COLUMNS.tablet, GRID_COLUMNS.desktop, GRID_COLUMNS.wide,
      'sm:space-y-0 sm:gap-1 sm:items-center sm:p-2.5',
      'md:gap-1.5 md:p-3',
      'lg:gap-2 lg:p-3.5',
      'xl:gap-2.5 xl:p-4'
    )
  };

  return (
    <div className={cn(
      gridClasses[variant],
      'transition-all duration-200 ease-in-out',
      'w-full overflow-hidden', // Ensure no horizontal overflow
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
      'flex items-center gap-2 text-xs font-medium whitespace-nowrap',
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
      'flex flex-col justify-center gap-0.5 w-full overflow-hidden',
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

  Badge: ({ children, className, variant = 'default' }: { 
    children: React.ReactNode; 
    className?: string;
    variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning';
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
          variantClasses[variant],
          className
        )}>
          {children}
        </span>
      </div>
    );
  },

  Action: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn('flex items-center justify-center whitespace-nowrap', className)}>
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
        'flex items-center text-xs tabular-nums font-medium whitespace-nowrap',
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
      'px-2 py-2 bg-gradient-to-r from-muted/40 to-muted/60',
      'border-b-2 border-border/30',
      'backdrop-blur-sm',
      className
    )}>
      <EventGrid variant="header" className="min-h-[32px] text-xs font-bold text-foreground/90 tracking-wide">
        <div>Date</div>
        <div>Event Details</div>
        <div className="hidden sm:block">Type</div>
        <div className="hidden md:block">Variant</div>
        <div className="text-center">Equipment</div>
        <div className="text-center">Crew</div>
        <div className="text-center">Status</div>
        <div className="text-right hidden xl:block">Equipment</div>
        <div className="text-right hidden lg:block">Crew</div>
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

            {/* Type Badge Column - Hide THIRD when space is tight */}
            <div className="text-xs font-semibold text-muted-foreground/80 tracking-wider uppercase hidden sm:block">
              Type
            </div>
        
            {/* Variant Column - Hide FOURTH when space is tight */}
            <div className="text-xs font-semibold text-muted-foreground/80 tracking-wider uppercase hidden md:block">
              Variant
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
        
        {/* Equipment Price Column - Hide FIRST when space is tight (show only on wide+ screens) */}
        <div className="text-right text-xs font-semibold text-muted-foreground/80 tracking-wider uppercase hidden xl:block">
          Equipment
        </div>
        
        {/* Crew Price Column - Hide SECOND when space is tight (show from desktop+ screens) */}
        <div className="text-right text-xs font-semibold text-muted-foreground/80 tracking-wider uppercase hidden lg:block">
          Crew
        </div>
        
        {/* Total Price Column - HIGHEST PRIORITY, always visible */}
        <div className="text-right text-xs font-bold text-muted-foreground/90 tracking-wider uppercase">
          Total
        </div>
      </EventGrid>
    </div>
  );
}