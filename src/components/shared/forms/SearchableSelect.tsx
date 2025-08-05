/**
 * CONSOLIDATED: SearchableSelect - Eliminates select component duplication
 * 
 * Replaces similar patterns in CustomerSelect, OwnerSelect, and other select components
 * Provides generic searchable/scrollable select with consistent UX and error handling
 */

import { ReactNode } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface SelectOption {
  id: string;
  name: string;
  displayName?: string; // Optional alternative display text
  subtitle?: string;    // Optional subtitle/description
  disabled?: boolean;
}

export interface SearchableSelectProps {
  // Data
  options: SelectOption[];
  loading?: boolean;
  
  // Value control
  value: string;
  onChange: (value: string) => void;
  
  // Configuration
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  
  // Validation
  error?: string;
  
  // Customization
  maxHeight?: string;
  renderOption?: (option: SelectOption) => ReactNode;
  groupBy?: (option: SelectOption) => string; // For grouping options
  
  // Loading state
  loadingText?: string;
  emptyText?: string;
}

/**
 * Generic searchable select component with scrolling and error states
 */
export function SearchableSelect({
  options,
  loading = false,
  value,
  onChange,
  placeholder = "Select option",
  required = false,
  disabled = false,
  className,
  error,
  maxHeight = "200px",
  renderOption,
  groupBy,
  loadingText = "Loading...",
  emptyText = "No options available"
}: SearchableSelectProps) {

  // Group options if groupBy function provided
  const groupedOptions = groupBy 
    ? options.reduce((groups, option) => {
        const group = groupBy(option);
        if (!groups[group]) groups[group] = [];
        groups[group].push(option);
        return groups;
      }, {} as Record<string, SelectOption[]>)
    : null;

  const renderSelectOption = (option: SelectOption) => {
    if (renderOption) {
      return renderOption(option);
    }

    return (
      <div className="flex flex-col">
        <span>{option.displayName || option.name}</span>
        {option.subtitle && (
          <span className="text-xs text-muted-foreground">{option.subtitle}</span>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <SelectItem value="__loading__" disabled className="text-muted-foreground">
          {loadingText}
        </SelectItem>
      );
    }

    if (options.length === 0) {
      return (
        <SelectItem value="__empty__" disabled className="text-muted-foreground">
          {emptyText}
        </SelectItem>
      );
    }

    if (groupedOptions) {
      return Object.entries(groupedOptions).map(([groupName, groupOptions]) => (
        <div key={groupName}>
          {/* Group header */}
          <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-b">
            {groupName}
          </div>
          {/* Group options */}
          {groupOptions.map(option => (
            <SelectItem 
              key={option.id} 
              value={option.id}
              disabled={option.disabled}
              className="cursor-pointer rounded-sm hover:bg-muted pl-4"
            >
              {renderSelectOption(option)}
            </SelectItem>
          ))}
        </div>
      ));
    }

    return options.map(option => (
      <SelectItem 
        key={option.id} 
        value={option.id}
        disabled={option.disabled}
                    className="cursor-pointer rounded-sm hover:bg-muted"
      >
        {renderSelectOption(option)}
      </SelectItem>
    ));
  };

  return (
    <div className="space-y-2">
      <Select
        value={value}
        onValueChange={onChange}
        disabled={loading || disabled}
        required={required}
      >
        <SelectTrigger className={cn(
          error ? "border-red-500" : "", 
          className
        )}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <ScrollArea className="w-full" style={{ height: maxHeight }}>
            <div className="p-1">
              {renderContent()}
            </div>
          </ScrollArea>
        </SelectContent>
      </Select>
      
              {error && (
          <p className="text-sm font-medium text-destructive">{error}</p>
        )}
    </div>
  );
}

/**
 * Specialized component for data-driven selects (customers, crew members, etc.)
 */
export interface DataSelectProps<T = any> extends Omit<SearchableSelectProps, 'options' | 'loading'> {
  data: T[];
  loading?: boolean;
  getOptionId: (item: T) => string;
  getOptionName: (item: T) => string;
  getOptionDisplayName?: (item: T) => string;
  getOptionSubtitle?: (item: T) => string;
  getOptionGroup?: (item: T) => string;
}

export function DataSelect<T>({
  data,
  loading = false,
  getOptionId,
  getOptionName,
  getOptionDisplayName,
  getOptionSubtitle,
  getOptionGroup,
  ...selectProps
}: DataSelectProps<T>) {
  
  const options: SelectOption[] = data.map(item => ({
    id: getOptionId(item),
    name: getOptionName(item),
    displayName: getOptionDisplayName?.(item),
    subtitle: getOptionSubtitle?.(item)
  }));

  const groupBy = getOptionGroup ? (option: SelectOption) => {
    const item = data.find(d => getOptionId(d) === option.id);
    return item ? getOptionGroup(item) : 'Other';
  } : undefined;

  return (
    <SearchableSelect
      options={options}
      loading={loading}
      groupBy={groupBy}
      {...selectProps}
    />
  );
}