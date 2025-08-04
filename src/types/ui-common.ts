/**
 * UNIFIED UI TYPES
 * 
 * Consolidates common interface patterns across components
 * Reduces duplication and ensures consistency
 */

import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

// ========== COMMON FILTER TYPES ==========

export interface BaseFilters {
  search?: string;
}

export interface TabFilters extends BaseFilters {
  // Filters that work with tab systems
}

export interface OwnerFilters extends BaseFilters {
  owner?: string;
}

export interface ResourceFilters extends BaseFilters {
  type?: string;
  folder?: string;
  role?: string;
}

export interface DateRangeFilters extends BaseFilters {
  startDate?: string;
  endDate?: string;
}

// ========== COMMON HEADER PROPS ==========

export interface Tab<T = string> {
  value: T;
  label: string;
  icon?: LucideIcon;
  color?: string;
  count?: number;
}

export interface BaseHeaderProps<TTab = string, TFilters = BaseFilters> {
  // Tab management
  activeTab?: TTab;
  onTabChange?: (tab: TTab) => void;
  tabs?: Tab<TTab>[];
  
  // Filter management
  filters?: TFilters;
  onFiltersChange?: (filters: TFilters) => void;
  
  // Actions
  onAddClick?: () => void;
  onRefresh?: () => void;
  
  // Appearance
  title?: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
}

// ========== COMMON TABLE PROPS ==========

export interface BaseTableProps<TItem = any, TFilters = BaseFilters> {
  // Data
  data?: TItem[];
  loading?: boolean;
  
  // Filtering
  activeTab?: string;
  filters?: TFilters;
  
  // Selection
  selectedItems?: string[];
  onItemSelect?: (id: string) => void;
  onSelectAll?: (checked: boolean) => void;
  
  // Interactions
  onItemClick?: (item: TItem) => void;
  onItemDoubleClick?: (item: TItem) => void;
  
  // Appearance
  emptyMessage?: string;
}

// ========== COMMON DIALOG PROPS ==========

export interface BaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface FormDialogProps extends BaseDialogProps {
  title?: string;
  description?: string;
  loading?: boolean;
  onSubmit?: () => void;
  onCancel?: () => void;
}

// ========== COMMON CARD PROPS ==========

export interface BaseCardProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  loading?: boolean;
  onClick?: () => void;
  href?: string;
  className?: string;
}

// ========== STATUS AND STATE TYPES ==========

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncData<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch?: () => void;
}

// ========== COMMON ACTION TYPES ==========

export interface ActionItem {
  key: string;
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'ghost';
  disabled?: boolean;
}

export interface BulkActionProps {
  selectedCount: number;
  actions: ActionItem[];
  onClearSelection: () => void;
}

// ========== COMMON LAYOUT TYPES ==========

export interface PageLayoutProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export interface SectionLayoutProps {
  title?: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

// ========== UTILITY TYPES ==========

export type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Common ID type for consistent referencing
export type EntityId = string;

// Common timestamp type
export type Timestamp = string;

// Common color type for themes/status
export type ColorValue = string;