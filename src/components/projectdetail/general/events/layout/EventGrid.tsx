/**
 * 🎯 EVENT GRID LAYOUT
 * 
 * Professional responsive grid system using design system patterns
 * Supports mobile-first responsive design with proper breakpoints
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { RESPONSIVE, COMPONENT_CLASSES } from '@/design-system';
import { Package, Users, Settings2, CheckCircle, Clock, Send, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { STATUS_PATTERNS } from '@/design-system';
import { useConsolidatedProjectSync } from '@/hooks/useConsolidatedSyncStatus';

// Status configuration for bulk actions
const STATUS_CONFIG = {
  proposed: {
    icon: Clock,
    label: 'Proposed',
    pattern: STATUS_PATTERNS.warning,
    description: 'Waiting for confirmation'
  },
  confirmed: {
    icon: CheckCircle,
    label: 'Confirmed',
    pattern: STATUS_PATTERNS.success,
    description: 'Ready for production'
  },
  'invoice ready': {
    icon: Send,
    label: 'Invoice Ready',
    pattern: STATUS_PATTERNS.info,
    description: 'Ready to invoice'
  },
  cancelled: {
    icon: XCircle,
    label: 'Cancelled',
    pattern: STATUS_PATTERNS.critical,
    description: 'Event cancelled'
  },
  invoiced: {
    icon: CheckCircle,
    label: 'Invoiced',
    pattern: STATUS_PATTERNS.operational,
    description: 'Completed and invoiced'
  }
} as const;

// Shared grid column definitions - MUST stay in sync between header and cards
// Optimized for Norwegian currency display and Event column protection
const GRID_COLUMNS = {
  // Mobile: 6 columns - Core essentials only [Date, Details, Equipment, Crew, Status, Total]
  mobile: 'grid-cols-[60px_minmax(100px,1fr)_26px_26px_36px_65px]',
  // Small: 7 columns - Add Type [Date, Details, Type, Equipment, Crew, Status, Total] 
  small: 'sm:grid-cols-[65px_minmax(110px,1fr)_minmax(50px,1fr)_28px_28px_38px_70px]',
  // Tablet: 8 columns - Add Variant [Date, Details, Type, Variant, Equipment, Crew, Status, Total]
  tablet: 'md:grid-cols-[70px_minmax(120px,1fr)_minmax(55px,1fr)_minmax(45px,1fr)_30px_30px_40px_75px]',
  // Desktop: 9 columns - Add Crew € [Date, Details, Type, Variant, Equipment, Crew, Status, Crew €, Total]
  desktop: 'lg:grid-cols-[75px_minmax(130px,1fr)_minmax(60px,1fr)_minmax(50px,1fr)_32px_32px_42px_minmax(70px,1fr)_80px]',
  // Wide: 10 columns - Add Equipment € [Date, Details, Type, Variant, Equipment, Crew, Status, Equipment €, Crew €, Total]
  wide: 'xl:grid-cols-[80px_minmax(140px,1fr)_minmax(65px,1fr)_minmax(55px,1fr)_34px_34px_44px_minmax(75px,1fr)_minmax(75px,1fr)_85px]'
} as const;

export interface EventGridProps {
  children: React.ReactNode;
  variant?: 'card' | 'header' | 'compact' | 'mobile';
  className?: string;
}

/**
 * 5-Tier CONTAINER-RESPONSIVE event grid - Scales to available space, no restacking:
 * 
 * Mobile (<640px): 6 columns - Core essentials only  
 * [Date:50px] [Event Details:100px-flex] [Equipment:26px] [Crew:26px] [Status:36px] [Total €:65px]
 * 
 * Small (640px+): 7 columns - Add Type column
 * [Date:55px] [Event Details:110px-flex] [Type:50px-flex] [Equipment:28px] [Crew:28px] [Status:38px] [Total €:70px]
 * 
 * Tablet (768px+): 8 columns - Add Variant column  
 * [Date:60px] [Event Details:120px-flex] [Type:55px-flex] [Variant:45px-flex] [Equipment:30px] [Crew:30px] [Status:40px] [Total €:75px]
 * 
 * Desktop (1024px+): 9 columns - Add Crew € column
 * [Date:65px] [Event Details:130px-flex] [Type:60px-flex] [Variant:50px-flex] [Equipment:32px] [Crew:32px] [Status:42px] [Crew €:70px-flex] [Total €:80px]
 * 
 * Wide (1280px+): 10 columns - Add Equipment € column (full grid)
 * [Date:70px] [Event Details:140px-flex] [Type:65px-flex] [Variant:55px-flex] [Equipment:34px] [Crew:34px] [Status:44px] [Equipment €:75px-flex] [Crew €:75px-flex] [Total €:85px]
 * 
 * PROGRESSIVE COLUMN ADDITION SYSTEM:
 * **Mobile (6 cols)**: Date, Event Details, Equipment Icon, Crew Icon, Status, Total € - Core essentials
 * **Small+ (7 cols)**: Add Type Badge - Context information  
 * **Tablet+ (8 cols)**: Add Variant - Additional context
 * **Desktop+ (9 cols)**: Add Crew € Price - Financial detail
 * **Wide+ (10 cols)**: Add Equipment € Price - Full financial breakdown
 * **CORE COLUMNS**: Never removed regardless of screen size
 * 
 * Container-Responsive Architecture - NO RESTACKING:
 * - **Fixed columns**: Date, icons, status, total € (essential always-visible)
 * - **Flexible columns**: Event details, type, variant, price columns (scale to container)
 * - **Layout preservation**: Never restacks - always maintains table structure
 * - **Space utilization**: Uses minmax() for minimum usability + 1fr for growth
 * - **Container adaptation**: Scales within available space (e.g., lg:grid-cols-[400px_1fr])
 * - Typography: xs → sm fluid scaling
 * - Breakpoints: 0px, 640px, 768px, 1024px, 1280px (full spectrum)
 * 
 * Mathematically Perfect Ultra-Compact Scaling + Progressive Column Addition:
 * - **Date Column**: 50→55→60→65→70px (fixed) - CORE (Always visible) - COMPACT
 * - **Event**: minmax(100→140px, 1fr) flexible - CORE (Always visible) - CONTAINER-RESPONSIVE
 * - **Icon Columns**: 26→28→30→32→34px (fixed) - CORE (Always visible) - COMPACT
 * - **Status Column**: 36→38→40→42→44px (fixed) - CORE (Always visible) - COMPACT
 * - **Total €**: 65→70→75→80→85px (fixed) - CORE (Always visible, HIGHEST PRIORITY) - COMPACT
 * - **Type**: minmax(50→65px, 1fr) flexible - PROGRESSIVE (sm+ only, 7th column) - CONTAINER-RESPONSIVE
 * - **Variant**: minmax(45→55px, 1fr) flexible - PROGRESSIVE (md+ only, 8th column) - CONTAINER-RESPONSIVE
 * - **Crew €**: minmax(70→75px, 1fr) flexible - PROGRESSIVE (lg+ only, 9th column) - CONTAINER-RESPONSIVE
 * - **Equipment €**: minmax(75px, 1fr) flexible - PROGRESSIVE (xl+ only, 10th column) - CONTAINER-RESPONSIVE
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
      'md:gap-1.5 md:px-2.5 md:py-1.5',
      'lg:gap-1.5 lg:px-2.5 lg:py-2',
      'xl:gap-2 xl:px-2.5 xl:py-2'
    ),
    
    // Table header - mathematically optimized 5-tier progressive system
    header: cn(
      'grid', GRID_COLUMNS.mobile, GRID_COLUMNS.small, GRID_COLUMNS.tablet, GRID_COLUMNS.desktop, GRID_COLUMNS.wide,
      'gap-0.5 items-center min-h-[32px] px-1.5 py-1.5',
      'sm:gap-1 sm:px-2 sm:py-2',
      'md:gap-1.5 md:px-2.5 md:py-2',
      'lg:gap-1.5 lg:px-2.5 lg:py-2',
      'xl:gap-2 xl:px-2.5 xl:py-2',
      'text-xs font-semibold text-muted-foreground/80 tracking-wide uppercase',
      'sm:text-xs',
      'border-b border-border/20 pb-1.5 mb-1.5'
    ),
    
    // Ultra-compact for dense layouts - optimized progression
    compact: cn(
      'grid', GRID_COLUMNS.mobile, GRID_COLUMNS.small, GRID_COLUMNS.tablet, GRID_COLUMNS.desktop, GRID_COLUMNS.wide,
      'gap-0 items-center min-h-[28px] px-1 py-0.5 text-xs',
      'sm:gap-0.5 sm:px-1.5 sm:py-1 sm:text-xs',
      'md:gap-1 md:px-2 md:py-1',
      'lg:gap-1 lg:px-2 lg:py-1.5',
      'xl:gap-1.5 xl:px-2.5 xl:py-2'
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
      'flex flex-col justify-center gap-0.5 w-full overflow-hidden min-w-0',
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
      total: 'text-foreground font-bold',
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
      <EventGrid variant="header" className="min-h-[32px] text-xs font-semibold text-foreground/90 tracking-wide">
        <div>Date</div>
        <div>Event</div>
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
  onStatusChange,
  onSyncSectionEquipment,
  onSyncSectionCrew,
  onBulkStatusChange
}: { 
  className?: string;
  events?: any[];
  onStatusChange?: (event: any, newStatus: any) => void;
  onSyncSectionEquipment?: () => void;
  onSyncSectionCrew?: () => void;
  onBulkStatusChange?: (newStatus: string) => void;
}) {
  // Get consolidated sync data for all events
  const projectId = events?.[0]?.project_id;
  const { projectSyncData, isLoading } = useConsolidatedProjectSync(projectId || '');
  return (
    <div className={cn(
      'border-b border-border/10 bg-muted/20 rounded-b-lg',
      className
    )}>
                <EventGrid variant="header" className="min-h-[28px] py-0.5 md:py-0.5">
            {/* Date Column */}
            <div className="text-xs font-semibold text-muted-foreground/80 tracking-wider uppercase">
              Date
            </div>

            {/* Event Column */}
            <div className="text-xs font-semibold text-muted-foreground/80 tracking-wider uppercase">
              Event
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
              {events && events.length > 0 && events[0]?.type?.needs_equipment && (() => {
                if (isLoading || !projectSyncData) {
                  return (
                    <Button variant="ghost" size="icon" className="h-10 w-10 p-0" disabled>
                      <Package className="h-5 w-5 text-gray-400" />
                    </Button>
                  );
                }
                
                // Check equipment sync status using consolidated data
                const eventsWithEquipment = events.filter(event => event.type?.needs_equipment);
                let allSynced = true;
                
                for (const event of eventsWithEquipment) {
                  const eventEq = projectSyncData.eventEquipment.get(event.id) || [];
                  if (eventEq.length === 0) {
                    allSynced = false;
                    break;
                  }
                  
                  // Check if all equipment items are synced
                  const hasUnsyncedEquipment = !projectSyncData.equipment.every(projEq => {
                    const eventItem = eventEq.find(eq => eq.equipment_id === projEq.equipment_id);
                    return eventItem && eventItem.is_synced;
                  });
                  
                  if (hasUnsyncedEquipment) {
                    allSynced = false;
                    break;
                  }
                }
                
                let iconColor = allSynced ? 'text-green-500' : 'text-blue-500';
                let tooltipText = allSynced ? 'All equipment synced' : `Sync equipment for all ${events.length} events`;
                
                return (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 p-0"
                    onClick={onSyncSectionEquipment}
                    disabled={!onSyncSectionEquipment}
                    title={tooltipText}
                  >
                    <Package className={`h-5 w-5 ${iconColor}`} />
                  </Button>
                );
              })()}
            </div>

            {/* Crew Icon Column - Always visible */}
            <div className="flex items-center justify-center">
              {events && events.length > 0 && events[0]?.type?.needs_crew && (() => {
                if (isLoading || !projectSyncData) {
                  return (
                    <Button variant="ghost" size="icon" className="h-10 w-10 p-0" disabled>
                      <Users className="h-5 w-5 text-gray-400" />
                    </Button>
                  );
                }
                
                // Check crew sync status using consolidated data
                const eventsWithCrew = events.filter(event => event.type?.needs_crew);
                
                let allSynced = true;
                for (const event of eventsWithCrew) {
                  // Filter project roles by this event's variant
                  const eventVariantId = event.variant_id;
                  const variantProjectRoles = projectSyncData.projectRoles.filter(pr => pr.variant_id === eventVariantId);
                  const hasProjectRoles = variantProjectRoles.length > 0;
                  
                  if (hasProjectRoles) {
                    const eventRoles = projectSyncData.eventRoles.get(event.id) || [];
                    
                    // Check if all variant-specific project roles are assigned in this event
                    const hasUnassignedRoles = variantProjectRoles.some(pr => {
                      const eventRole = eventRoles.find(er => er.role_id === pr.role.id);
                      return !eventRole?.crew_member_id;
                    });
                    
                    if (hasUnassignedRoles) {
                      allSynced = false;
                      break;
                    }
                  }
                }
                
                let iconColor = allSynced ? 'text-green-500' : 'text-blue-500';
                let tooltipText = allSynced ? 'All crew synced' : `Sync crew for all ${events.length} events`;
                
                return (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 p-0"
                    onClick={onSyncSectionCrew}
                    disabled={!onSyncSectionCrew}
                    title={tooltipText}
                  >
                    <Users className={`h-5 w-5 ${iconColor}`} />
                  </Button>
                );
              })()}
            </div>
        
            {/* Status Action Column - Always visible */}
            <div className="flex items-center justify-center">
              {events && events.length > 0 && onBulkStatusChange && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 p-0"
                      title={`Change status for all ${events.length} events`}
                    >
                      <Settings2 className="h-5 w-5 text-white" />
                    </Button>
                  </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                        Bulk Actions ({events.length} events)
                      </div>
                      <DropdownMenuSeparator />
                      
                      {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                        const Icon = config.icon;
                        return (
                          <DropdownMenuItem
                            key={status}
                            onClick={() => onBulkStatusChange(status)}
                            className="flex items-center gap-3 cursor-pointer"
                          >
                            <Icon className={cn('h-4 w-4', config.pattern.text)} />
                            <div className="flex flex-col">
                              <span className="font-medium">{config.label}</span>
                              <span className="text-xs text-muted-foreground">
                                {config.description}
                              </span>
                            </div>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
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