/**
 * 🎯 EVENT ACTIONS COMPONENT
 * 
 * Handles event action buttons (edit, duplicate, delete, etc.)
 * Consolidated from: EventActions.tsx with design system integration
 */

import React from 'react';
import { CalendarEvent } from '@/types/events';
import { Button } from '@/components/ui/button';
import { 
  Edit2, 
  Copy, 
  Trash2, 
  MoreHorizontal,
  Calendar as CalendarIcon 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { COMPONENT_CLASSES } from '@/design-system';

export interface EventActionsProps {
  event: CalendarEvent;
  variant?: 'inline' | 'dropdown' | 'minimal';
  onEdit?: (event: CalendarEvent) => void;
  onDuplicate?: (event: CalendarEvent) => void;
  onDelete?: (event: CalendarEvent) => void;
  onMoveToDate?: (event: CalendarEvent) => void;
  showEdit?: boolean;
  showDuplicate?: boolean;
  showDelete?: boolean;
  showMoveToDate?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Main EventActions component with multiple display variants
 */
export function EventActions({
  event,
  variant = 'inline',
  onEdit,
  onDuplicate,
  onDelete,
  onMoveToDate,
  showEdit = true,
  showDuplicate = false,
  showDelete = false,
  showMoveToDate = false,
  disabled = false,
  className
}: EventActionsProps) {
  const isEditingDisabled = disabled || ['cancelled', 'invoice ready', 'invoiced'].includes(event.status);

  if (variant === 'minimal') {
    return showEdit && onEdit && !isEditingDisabled ? (
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(event);
        }}
        className={cn('h-8 w-8 text-muted-foreground hover:text-foreground', className)}
        aria-label="Edit event"
      >
        <Edit2 className="h-4 w-4" />
      </Button>
    ) : null;
  }

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {showEdit && onEdit && !isEditingDisabled && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(event);
            }}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label="Edit event"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
        
        {showDuplicate && onDuplicate && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(event);
            }}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label="Duplicate event"
          >
            <Copy className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'dropdown') {
    const hasActions = (showEdit && onEdit && !isEditingDisabled) || 
                       (showDuplicate && onDuplicate) || 
                       (showDelete && onDelete) || 
                       (showMoveToDate && onMoveToDate);

    if (!hasActions) return null;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8', className)}
            aria-label="Event actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
            Event Actions
          </div>
          <DropdownMenuSeparator />
          
          {showEdit && onEdit && !isEditingDisabled && (
            <DropdownMenuItem 
              onClick={() => onEdit(event)}
              className="flex items-center gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Edit event
            </DropdownMenuItem>
          )}
          
          {showDuplicate && onDuplicate && (
            <DropdownMenuItem 
              onClick={() => onDuplicate(event)}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Duplicate event
            </DropdownMenuItem>
          )}
          
          {showMoveToDate && onMoveToDate && (
            <DropdownMenuItem 
              onClick={() => onMoveToDate(event)}
              className="flex items-center gap-2"
            >
              <CalendarIcon className="h-4 w-4" />
              Move to date
            </DropdownMenuItem>
          )}
          
          {showDelete && onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(event)}
                className="flex items-center gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete event
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return null;
}

/**
 * Utility functions for event actions
 */
export const eventActionUtils = {
  canEdit: (event: CalendarEvent) => 
    !['cancelled', 'invoice ready', 'invoiced'].includes(event.status),
  
  canDelete: (event: CalendarEvent) =>
    !['invoice ready', 'invoiced'].includes(event.status),
  
  canDuplicate: (event: CalendarEvent) => true,
  
  getDisabledReason: (event: CalendarEvent) => {
    if (event.status === 'cancelled') return 'Cancelled events cannot be edited';
    if (event.status === 'invoice ready') return 'Events ready for invoice cannot be edited';
    if (event.status === 'invoiced') return 'Invoiced events cannot be edited';
    return null;
  }
} as const;