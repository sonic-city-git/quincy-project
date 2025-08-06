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
const GRID_COLUMNS = {
  mobile: 'grid-cols-[minmax(100px,120px)_minmax(200px,1fr)_32px_32px_32px_minmax(100px,140px)_48px_minmax(80px,100px)_minmax(80px,100px)_minmax(90px,120px)]',
  desktop: 'md:grid-cols-[120px_1fr_36px_36px_36px_140px_52px_100px_100px_120px]'
} as const;

export interface EventGridProps {
  children: React.ReactNode;
  variant?: 'card' | 'header' | 'compact' | 'mobile';
  className?: string;
}

/**
 * Responsive event grid optimized for all screen sizes:
 * Desktop: [Date] [Event] [📍] [📦] [👥] [Type] [Status] [Equipment €] [Crew €] [Total €]
 * Mobile: Stacked layout with key info
 */
export function EventGrid({ 
  children, 
  variant = 'card',
  className 
}: EventGridProps) {
  const gridClasses = {
    // Event cards - using shared grid columns
    card: cn(
      'grid', GRID_COLUMNS.mobile, GRID_COLUMNS.desktop,
      'gap-3 items-center min-h-[60px] px-3 py-2',
      'md:gap-4 md:px-4 md:py-3'
    ),
    
    // Table header - using same grid columns with header styling
    header: cn(
      'grid', GRID_COLUMNS.mobile, GRID_COLUMNS.desktop,
      'gap-3 items-center min-h-[52px] px-3 py-3',
      'md:gap-4 md:px-4',
      'text-sm font-semibold text-muted-foreground/80 tracking-wide uppercase',
      'border-b border-border/20 pb-3 mb-3'
    ),
    
    // Compact for mobile or dense layouts
    compact: cn(
      'grid grid-cols-[80px_1fr_28px_28px_28px_90px_40px_70px_70px_80px]',
      'gap-2 items-center min-h-[44px] px-1 text-sm'
    ),
    
    // Mobile-first stacked layout
    mobile: cn(
      'flex flex-col space-y-2 p-3',
      'sm:grid sm:grid-cols-[100px_1fr_32px_32px_32px_120px_48px_80px_80px_90px]',
      'sm:space-y-0 sm:gap-2 sm:items-center'
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
      'flex flex-col justify-center min-w-0 gap-0.5',
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
        <div className="text-center hidden md:block">Location</div>
        <div className="text-center hidden md:block">Equipment</div>
        <div className="text-center hidden md:block">Crew</div>
        <div>Type</div>
        <div className="text-center hidden md:block">Status</div>
        <div className="text-right">Equipment</div>
        <div className="text-right">Crew</div>
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
        <EventGridColumns.Date className="text-xs font-semibold text-muted-foreground/80 tracking-wider uppercase">
          Date
        </EventGridColumns.Date>
        
        {/* Event Details Column */}
        <EventGridColumns.Event className="text-xs font-semibold text-muted-foreground/80 tracking-wider uppercase">
          Event Details
        </EventGridColumns.Event>
        
        {/* Location Icon Column */}
        <EventGridColumns.Icon>
          <div className="hidden md:block"></div>
        </EventGridColumns.Icon>
        
        {/* Equipment Icon Column */}
        <EventGridColumns.Icon>
          {events && events.length > 0 && events[0]?.type?.needs_equipment && (
            <Package className="h-6 w-6 text-blue-600 hover:text-blue-700 cursor-pointer transition-colors" />
          )}
        </EventGridColumns.Icon>
        
        {/* Crew Icon Column */}
        <EventGridColumns.Icon>
          {events && events.length > 0 && events[0]?.type?.needs_crew && (
            <Users className="h-6 w-6 text-green-600 hover:text-green-700 cursor-pointer transition-colors" />
          )}
        </EventGridColumns.Icon>
        
        {/* Type Badge Column */}
        <EventGridColumns.Badge className="text-xs font-semibold text-muted-foreground/80 tracking-wider uppercase">
          Type
        </EventGridColumns.Badge>
        
        {/* Status Action Column */}
        <EventGridColumns.Action>
          {events && events.length > 0 && onStatusChange && (
            <Settings2 className="h-6 w-6 text-orange-600 hover:text-orange-700 cursor-pointer transition-colors" />
          )}
        </EventGridColumns.Action>
        
        {/* Equipment Price Column */}
        <EventGridColumns.Price className="text-xs font-semibold text-muted-foreground/80 tracking-wider uppercase">
          <span className="hidden md:inline">Equipment</span>
          <span className="md:hidden">Equip</span>
        </EventGridColumns.Price>
        
        {/* Crew Price Column */}
        <EventGridColumns.Price className="text-xs font-semibold text-muted-foreground/80 tracking-wider uppercase">
          <span className="hidden md:inline">Crew</span>
          <span className="md:hidden">Crew</span>
        </EventGridColumns.Price>
        
        {/* Total Price Column */}
        <EventGridColumns.Price className="text-xs font-bold text-muted-foreground/90 tracking-wider uppercase">
          Total
        </EventGridColumns.Price>
      </EventGrid>
    </div>
  );
}