/**
 * STANDARDIZED FILTER COMPONENTS
 * 
 * Consolidates all filter implementations with consistent styling
 * Reduces duplication across projects, resources, crew, equipment
 */

import { ReactNode } from 'react';
import { X, Search, Filter } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { COMPONENT_VARIANTS, TRANSITIONS } from "@/constants/theme";

export interface FilterOption {
  value: string;
  label: string;
  icon?: ReactNode;
  avatar?: string;
  count?: number;
}

export interface FilterProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options?: FilterOption[];
  loading?: boolean;
  clearable?: boolean;
  className?: string;
}

/**
 * Standardized search input
 */
export function StandardizedSearchInput({
  value = '',
  onChange,
  placeholder = "Search...",
  className = ''
}: FilterProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`pl-9 h-8 text-xs ${COMPONENT_VARIANTS.filter} ${TRANSITIONS.default} ${className}`}
      />
    </div>
  );
}

/**
 * Standardized select filter
 */
export function StandardizedSelectFilter({
  value = 'all',
  onChange,
  placeholder = "All",
  options = [],
  loading = false,
  clearable = true,
  className = ''
}: FilterProps) {
  const selectedOption = options.find(opt => opt.value === value);
  const hasSelection = value && value !== 'all';

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger 
        className={`w-auto min-w-[140px] h-8 text-xs ${COMPONENT_VARIANTS.filter} ${TRANSITIONS.default} ${
          hasSelection ? 'ring-2 ring-blue-500/50 border-blue-500/50 bg-blue-50/50' : ''
        } ${className}`}
      >
        <div className="flex items-center gap-2">
          {selectedOption?.icon && (
            <div className="flex-shrink-0">
              {selectedOption.icon}
            </div>
          )}
          {selectedOption?.avatar && (
            <img
              src={selectedOption.avatar}
              alt={selectedOption.label}
              className="h-4 w-4 rounded-full ring-1 ring-border shadow-sm"
            />
          )}
          <span className="truncate">
            {selectedOption?.label || placeholder}
          </span>
          {selectedOption?.count && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {selectedOption.count}
            </Badge>
          )}
        </div>
      </SelectTrigger>
      <SelectContent className="w-[200px]">
        {/* Default "All" option */}
        <SelectItem value="all">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
              <span className="text-xs text-muted-foreground">All</span>
            </div>
            <span>{placeholder}</span>
          </div>
        </SelectItem>
        
        {/* Provided options */}
        {options.map(option => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center gap-2">
              {option.icon && (
                <div className="flex-shrink-0">
                  {option.icon}
                </div>
              )}
              {option.avatar && (
                <img
                  src={option.avatar}
                  alt={option.label}
                  className="h-5 w-5 rounded-full ring-1 ring-border shadow-sm"
                />
              )}
              {!option.icon && !option.avatar && (
                <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-xs font-medium text-muted-foreground">
                    {option.label.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="truncate">{option.label}</span>
              {option.count && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0 ml-auto">
                  {option.count}
                </Badge>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Standardized filter clear button
 */
export function StandardizedFilterClear({
  onClear,
  hasActiveFilters = false,
  className = ''
}: {
  onClear: () => void;
  hasActiveFilters?: boolean;
  className?: string;
}) {
  if (!hasActiveFilters) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClear}
      className={`h-8 px-2 text-xs text-muted-foreground hover:text-foreground ${TRANSITIONS.default} ${className}`}
    >
      <X className="h-3 w-3 mr-1" />
      Clear
    </Button>
  );
}

/**
 * Active filter badges
 */
export function StandardizedActiveFilters({
  filters,
  onRemoveFilter,
  className = ''
}: {
  filters: Array<{ key: string; label: string; value: string }>;
  onRemoveFilter: (key: string) => void;
  className?: string;
}) {
  if (filters.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {filters.map(filter => (
        <Badge
          key={filter.key}
          variant="secondary"
          className="flex items-center gap-1 text-xs px-2 py-1"
        >
          <Filter className="h-3 w-3" />
          <span>{filter.label}: {filter.value}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemoveFilter(filter.key)}
            className="h-auto p-0 hover:bg-transparent"
          >
            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          </Button>
        </Badge>
      ))}
    </div>
  );
}

/**
 * Filter summary component
 */
export function StandardizedFilterSummary({
  totalItems,
  filteredItems,
  activeFiltersCount = 0,
  className = ''
}: {
  totalItems: number;
  filteredItems: number;
  activeFiltersCount?: number;
  className?: string;
}) {
  if (activeFiltersCount === 0) {
    return (
      <div className={`text-xs text-muted-foreground ${className}`}>
        {totalItems} items
      </div>
    );
  }

  return (
    <div className={`text-xs text-muted-foreground ${className}`}>
      Showing {filteredItems} of {totalItems} items
      {activeFiltersCount > 0 && (
        <span className="ml-1">
          ({activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} applied)
        </span>
      )}
    </div>
  );
}