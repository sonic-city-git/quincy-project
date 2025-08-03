/**
 * CONSOLIDATED STATUS CARD COMPONENT
 * 
 * Eliminates duplication between DashboardStatsCards and RevenueChart
 * Provides consistent styling, priority indicators, and loading states
 */

import { ReactNode } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from 'lucide-react';

// Consolidated status types and colors
export type StatusType = 'critical' | 'high' | 'warning' | 'info' | 'success' | 'operational';
export type StatusVariant = 'default' | 'compact' | 'revenue';

// Unified color system for dashboard components
export const STATUS_COLORS = {
  critical: {
    text: 'text-red-500',
    bg: 'from-red-50/10 to-red-100/10', 
    border: 'border-red-200/20',
    accent: 'from-red-500 to-red-600',
    ring: 'ring-red-500/20'
  },
  high: {
    text: 'text-amber-500',
    bg: 'from-amber-50/10 to-amber-100/10',
    border: 'border-amber-200/20', 
    accent: 'from-amber-500 to-amber-600',
    ring: 'ring-amber-500/20'
  },
  warning: {
    text: 'text-orange-500',
    bg: 'from-orange-50/10 to-orange-100/10',
    border: 'border-orange-200/20',
    accent: 'from-orange-500 to-orange-600',
    ring: 'ring-orange-500/20'
  },
  info: {
    text: 'text-blue-500',
    bg: 'from-blue-50/10 to-blue-100/10',
    border: 'border-blue-200/20',
    accent: 'from-blue-500 to-blue-600',
    ring: 'ring-blue-500/20'
  },
  success: {
    text: 'text-green-500',
    bg: 'from-green-50/10 to-green-100/10',
    border: 'border-green-200/20',
    accent: 'from-green-500 to-green-600',
    ring: 'ring-green-500/20'
  },
  operational: {
    text: 'text-slate-500',
    bg: 'from-slate-50/10 to-slate-100/10',
    border: 'border-slate-200/20',
    accent: 'from-slate-500 to-slate-600',
    ring: 'ring-slate-500/20'
  }
} as const;

export interface StatusCardProps {
  // Content
  title: string;
  value: ReactNode;
  subtitle?: string;
  icon?: LucideIcon;
  
  // Status and appearance
  status: StatusType;
  variant?: StatusVariant;
  loading?: boolean;
  highlighted?: boolean;
  
  // Interactions
  onClick?: () => void;
  children?: ReactNode; // For custom content
}

/**
 * Unified status card component used across dashboard
 */
export function StatusCard({
  title,
  value,
  subtitle,
  icon: Icon,
  status,
  variant = 'default',
  loading = false,
  highlighted = false,
  onClick,
  children
}: StatusCardProps) {
  const colors = STATUS_COLORS[status];
  const showPriorityBar = (status === 'critical' || status === 'high') && 
                          typeof value === 'number' && value > 0;
  
  // Variant-specific styling
  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return {
          card: 'border-0 shadow-md relative overflow-hidden transition-all hover:shadow-lg',
          content: 'p-2',
          layout: 'text-center space-y-1',
          iconContainer: 'mx-auto w-8 h-8 rounded-lg bg-background/20 flex items-center justify-center',
          icon: 'h-4 w-4',
          value: 'text-lg font-bold',
          title: 'text-xs font-medium truncate', 
          subtitle: 'text-xs text-muted-foreground/60 truncate'
        };
      case 'revenue':
        return {
          card: 'border transition-all duration-200',
          content: 'p-4',
          layout: 'flex items-center gap-3',
          iconContainer: 'w-3 h-3 rounded-full flex-shrink-0',
          icon: 'w-full h-full',
          value: 'text-xl font-bold',
          title: 'text-xs font-medium uppercase tracking-wide',
          subtitle: 'text-xs text-muted-foreground'
        };
      default:
        return {
          card: 'border transition-all hover:shadow-md',
          content: 'p-4',
          layout: 'space-y-3',
          iconContainer: 'w-10 h-10 rounded-lg bg-background/20 flex items-center justify-center',
          icon: 'h-5 w-5',
          value: 'text-2xl font-bold',
          title: 'text-sm font-medium',
          subtitle: 'text-sm text-muted-foreground'
        };
    }
  };

  const classes = getVariantClasses();
  
  return (
    <Card 
      className={`
        ${classes.card}
        bg-gradient-to-br ${colors.bg} 
        border ${colors.border}
        ${highlighted ? `ring-2 ${colors.ring}` : ''}
        ${onClick ? 'cursor-pointer' : ''}
      `}
      onClick={onClick}
    >
      {/* Priority indicator bar */}
      {showPriorityBar && (
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${colors.accent}`} />
      )}
      
      <CardContent className={classes.content}>
        <div className={classes.layout}>
          {/* Icon */}
          {Icon && (
            <div className={`${classes.iconContainer} ${variant === 'revenue' ? colors.text : ''}`}>
              <Icon className={`${classes.icon} ${variant !== 'revenue' ? colors.text : ''}`} />
            </div>
          )}
          
          {/* Content */}
          <div className={variant === 'revenue' ? 'flex-1' : ''}>
            <p className={`${classes.title} ${variant === 'revenue' ? colors.text : ''}`}>
              {title}
            </p>
            {subtitle && (
              <p className={classes.subtitle}>{subtitle}</p>
            )}
            {loading ? (
              <Skeleton className={`${variant === 'compact' ? 'h-5 w-6 mx-auto' : 'h-6 w-8'}`} />
            ) : (
              <p className={`${classes.value} ${colors.text}`}>{value}</p>
            )}
          </div>
          
          {/* Custom content */}
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Helper function to determine status from value and thresholds
 */
export function getStatusFromValue(value: number, thresholds: {
  critical?: number;
  warning?: number; 
  success?: number;
}): StatusType {
  if (thresholds.critical !== undefined && value >= thresholds.critical) {
    return 'critical';
  }
  if (thresholds.warning !== undefined && value >= thresholds.warning) {
    return 'warning';
  }
  if (thresholds.success !== undefined && value <= thresholds.success) {
    return 'success';
  }
  return 'operational';
}

/**
 * Status-based card grid layouts
 */
export function StatusCardGrid({ 
  children, 
  columns = 4 
}: { 
  children: ReactNode;
  columns?: number;
}) {
  const gridClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-3', 
    4: 'grid-cols-2 md:grid-cols-4'
  };
  
  return (
    <div className={`grid ${gridClasses[columns as keyof typeof gridClasses]} gap-3`}>
      {children}
    </div>
  );
}