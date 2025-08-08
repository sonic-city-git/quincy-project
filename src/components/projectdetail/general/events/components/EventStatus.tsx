/**
 * 🎯 EVENT STATUS COMPONENT
 * 
 * Unified status system using design system STATUS_PATTERNS
 * Consolidated from: EventStatusManager.tsx, StatusIcon.tsx
 */

import React from 'react';
import { CalendarEvent } from '@/types/events';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  CheckCircle, 
  Clock, 
  Send, 
  XCircle, 
  Settings2 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EVENT_STATUS_CONFIG, statusUtils } from '@/constants/eventStatus';

export interface EventStatusProps {
  event?: CalendarEvent;
  events?: CalendarEvent[];
  variant?: 'icon' | 'badge' | 'manager';
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Use unified status configuration
 */
const STATUS_CONFIG = EVENT_STATUS_CONFIG;

/**
 * Main EventStatus component with multiple variants
 */
export function EventStatus({ 
  event,
  events = [],
  variant = 'icon',
  onStatusChange,
  disabled = false,
  className 
}: EventStatusProps) {
  // Robust edge case handling
  const targetEvent = event || (events.length > 0 ? events[0] : null);
  if (!targetEvent || !targetEvent.status) return null;

  const config = STATUS_CONFIG[targetEvent.status as keyof typeof STATUS_CONFIG];
  if (!config) return null;

  if (variant === 'icon') {
    return <StatusIcon event={targetEvent} className={className} />;
  }

  if (variant === 'badge') {
    return <StatusBadge event={targetEvent} className={className} />;
  }

  if (variant === 'manager') {
    return (
      <StatusManager 
        event={targetEvent}
        events={events}
        onStatusChange={onStatusChange}
        disabled={disabled}
        className={className}
      />
    );
  }

  return null;
}

/**
 * Simple status icon display
 */
function StatusIcon({ event, className }: { event: CalendarEvent; className?: string }) {
  const config = STATUS_CONFIG[event.status as keyof typeof STATUS_CONFIG];
  const Icon = config.icon;

  return (
    <div className={cn('flex items-center justify-center h-10 w-10', className)}>
      <Icon className={cn('h-5 w-5', config.pattern.text)} />
    </div>
  );
}

/**
 * Status badge with background
 */
function StatusBadge({ event, className }: { event: CalendarEvent; className?: string }) {
  const config = STATUS_CONFIG[event.status as keyof typeof STATUS_CONFIG];
  const Icon = config.icon;

  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
      config.pattern.bg,
      config.pattern.border,
      config.pattern.text,
      'border',
      className
    )}>
      <Icon className="h-3 w-3" />
      {config.label}
    </div>
  );
}

/**
 * Status manager with dropdown for status changes
 */
function StatusManager({ 
  event, 
  events, 
  onStatusChange, 
  disabled,
  className 
}: {
  event: CalendarEvent;
  events: CalendarEvent[];
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
  disabled: boolean;
  className?: string;
}) {
  const handleStatusChangeAll = (newStatus: CalendarEvent['status']) => {
    if (events.length > 1) {
      events.forEach(evt => onStatusChange(evt, newStatus));
    } else {
      onStatusChange(event, newStatus);
    }
  };

  const isBulkAction = events.length > 1;
  const isActionDisabled = disabled || event.status === 'cancelled';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={isActionDisabled}
          className={cn('h-10 w-10', className)}
          aria-label={`Change status${isBulkAction ? ` for ${events.length} events` : ''}`}
        >
          <Settings2 className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {isBulkAction && (
          <>
            <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
              Bulk Actions ({events.length} events)
            </div>
            <DropdownMenuSeparator />
          </>
        )}
        
        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
          const Icon = config.icon;
          return (
            <DropdownMenuItem
              key={status}
              onClick={() => handleStatusChangeAll(status as CalendarEvent['status'])}
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
  );
}

/**
 * Export unified status utilities (backward compatibility)
 */
export { statusUtils };