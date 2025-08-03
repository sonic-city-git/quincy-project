/**
 * CONSOLIDATED: Shared Types - Eliminates type duplication across modules
 * 
 * Central location for commonly duplicated types and utility types
 * Provides type transformations and shared interfaces
 */

// Common ID and timestamp patterns
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// Common filter and search patterns
export interface BaseFilters {
  search?: string;
}

export interface FilterState<T extends BaseFilters> {
  filters: T;
  setFilters: (filters: T) => void;
  updateFilters: (updates: Partial<T>) => void;
  clearFilters: () => void;
}

// Common pagination patterns
export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// Common loading and error states
export interface AsyncState<T = any> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

// Common table/list item states
export interface SelectableItem {
  id: string;
  selected?: boolean;
}

export interface SortableItem {
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

// Common dialog/modal states
export interface DialogState {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Common form states
export interface FormState<T = any> {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  loading: boolean;
  touched: Partial<Record<keyof T, boolean>>;
}

// Database to TypeScript field name transformations
export type SnakeToCamel<S extends string> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<SnakeToCamel<U>>}`
  : S;

export type CamelCaseKeys<T> = {
  [K in keyof T as SnakeToCamel<string & K>]: T[K]
};

// Common API response patterns
export interface ApiResponse<T = any> {
  data: T;
  error?: string;
  message?: string;
}

export interface ApiListResponse<T = any> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}

// Common color and status patterns
export type StatusColor = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Common date/time patterns
export interface DateRange {
  start: Date;
  end: Date;
}

export interface TimeRange {
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
}