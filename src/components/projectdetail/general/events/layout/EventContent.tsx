/**
 * 🎯 EVENT CONTENT WRAPPER
 * 
 * Standardized content container with design system integration
 * Replaces: EventSectionContent.tsx with better structure
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { COMPONENT_CLASSES, RESPONSIVE } from '@/design-system';

export interface EventContentProps {
  children: React.ReactNode;
  variant?: 'section' | 'list' | 'card';
  spacing?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Flexible content container following design system patterns
 */
export function EventContent({ 
  children, 
  variant = 'section',
  spacing = 'md',
  className 
}: EventContentProps) {
  const spacingClasses = {
    sm: 'space-y-1',
    md: 'space-y-2', 
    lg: 'space-y-4'
  };

  const variantClasses = {
    section: cn(
      COMPONENT_CLASSES.card.subtle,
      'p-4',
      RESPONSIVE.spacing.items
    ),
    list: 'space-y-1',
    card: cn(
      COMPONENT_CLASSES.card.default,
      'p-3'
    )
  };

  return (
    <div className={cn(
      variantClasses[variant],
      spacingClasses[spacing],
      className
    )}>
      {children}
    </div>
  );
}

/**
 * Content sections for better organization
 */
export const EventContentSections = {
  Header: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn('border-b border-border pb-3 mb-4', className)}>
      {children}
    </div>
  ),

  Body: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn('flex-1', className)}>
      {children}
    </div>
  ),

  Footer: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn('border-t border-border pt-3 mt-4', className)}>
      {children}
    </div>
  ),

  Summary: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn(
      'mt-4 p-3 rounded-md',
      'bg-muted/50 border border-border/50',
      className
    )}>
      {children}
    </div>
  )
} as const;