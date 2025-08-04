import { Search, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LucideIcon } from "lucide-react";
import { useState, useEffect, useCallback, useRef, ReactNode } from "react";

// Generic tab type - can be extended by specific implementations
export interface Tab<T = string> {
  value: T;
  label: string;
  icon?: LucideIcon;
  color?: string;
}

// Generic header configuration
export interface HeaderConfig {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
}

// Generic search configuration  
export interface SearchConfig {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  searchInputRef?: React.RefObject<HTMLInputElement>;
}

// Generic props for the consolidated header
export interface SectionHeaderProps<TTab = string, TFilters = Record<string, any>> {
  // Header configuration
  header: HeaderConfig;
  
  // Tab configuration (optional)
  tabs?: {
    activeTab: TTab;
    onTabChange: (tab: TTab) => void;
    options: Tab<TTab>[];
  };
  
  // Search configuration (optional)
  search?: SearchConfig;
  
  // Filter management (optional)
  filters?: TFilters;
  onFiltersChange?: (filters: TFilters) => void;
  onClearFilters?: () => void;
  
  // Custom filter components as children
  children?: ReactNode;
  
  // Action buttons (optional)
  actions?: ReactNode;
  
  // Additional content below the main header (like timeline headers)
  additionalContent?: ReactNode;
}

/**
 * Consolidated SectionHeader component that eliminates duplication across:
 * - DashboardHeader
 * - ResourcesHeader  
 * - ProjectsHeader
 * - TimelineHeader
 * 
 * Provides consistent styling, search functionality, keyboard shortcuts,
 * and flexible slots for custom filters and actions.
 */
export function SectionHeader<TTab = string, TFilters = Record<string, any>>({
  header,
  tabs,
  search,
  filters,
  onFiltersChange,
  onClearFilters,
  children,
  actions,
  additionalContent
}: SectionHeaderProps<TTab, TFilters>) {
  // Local search state for immediate UI feedback
  const [localSearchValue, setLocalSearchValue] = useState(search?.value || '');
  const internalSearchRef = useRef<HTMLInputElement>(null);
  const searchInputRef = search?.searchInputRef || internalSearchRef;

  // Update local search when external search value changes
  useEffect(() => {
    setLocalSearchValue(search?.value || '');
  }, [search?.value]);

  // Debounced search to prevent lag
  useEffect(() => {
    if (!search) return;
    
    const timer = setTimeout(() => {
      if (localSearchValue !== search.value) {
        search.onChange(localSearchValue);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [localSearchValue, search]);

  // Keyboard shortcuts: Cmd+K to focus, ESC to clear search and filters
  useEffect(() => {
    if (!search && !onClearFilters) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd+K to focus search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k' && search) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      
      // ESC to clear search and filters and unfocus
      if (event.key === 'Escape') {
        event.preventDefault();
        if (search) {
          setLocalSearchValue('');
          search.onChange('');
          searchInputRef.current?.blur();
        }
        if (onClearFilters) {
          onClearFilters();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [search, onClearFilters, searchInputRef]);

  const { title, icon: IconComponent, iconColor = "text-blue-500" } = header;

  return (
    <div className="sticky top-[72px] z-40 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-sm">
      {/* Header with Title, Filters, and Tab Toggle */}
      <div className="flex items-center justify-between py-2 px-3 sm:py-3 sm:px-4 bg-background border-b border-border/30">
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
          {/* Icon + Title - Responsive */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <IconComponent className={`h-5 w-5 ${iconColor} flex-shrink-0`} />
            <h3 className="text-lg font-semibold truncate">{title}</h3>
          </div>
          
          {/* Search and Filters - Responsive Priority */}
          {(search || children) && (
            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 min-w-0 flex-1">
              {/* Search Bar - Always visible, responsive width and placeholder */}
              {search && (
                <div className="relative flex-1 min-w-[100px] max-w-[120px] xs:max-w-[140px] sm:max-w-[180px] md:max-w-[240px] lg:max-w-[280px]">
                  <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    placeholder={search.placeholder}
                    value={localSearchValue}
                    onChange={(e) => setLocalSearchValue(e.target.value)}
                    className={`
                      pl-8 sm:pl-9 h-8 transition-colors w-full text-xs sm:text-sm
                      placeholder:text-xs sm:placeholder:text-sm
                      ${localSearchValue ? 'ring-2 ring-blue-500/50 border-blue-500/50 bg-blue-50/50' : ''}
                    `}
                  />
                </div>
              )}

              {/* Custom Filter Components - Hide on small screens */}
              <div className="hidden lg:flex lg:items-center lg:gap-2">
                {children}
              </div>

              {/* Clear Filters Button - Hide on mobile, show on larger screens */}
              {onClearFilters && (search?.value || (filters && Object.values(filters).some(v => v))) && (
                <Button
                  onClick={onClearFilters}
                  variant="ghost"
                  size="sm"
                  className="hidden md:flex h-8 px-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Right side: Actions and Tab Toggle - Always visible but responsive */}
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0">
          {/* Action Buttons - Always visible but responsive styling */}
          {actions && (
            <div className="flex items-center gap-1">
              {actions}
            </div>
          )}

          {/* Tab Toggle - Always visible but responsive sizing */}
          {tabs && (
            <div className="flex items-center bg-muted/50 rounded-lg p-0.5 sm:p-1 border border-border/50">
              {tabs.options.map((tab) => {
                const isActive = tabs.activeTab === tab.value;
                const TabIcon = tab.icon;
                return (
                  <Button
                    key={String(tab.value)}
                    onClick={() => tabs.onTabChange(tab.value)}
                    variant="ghost"
                    size="sm"
                    className={`
                      h-8 sm:h-9 transition-all
                      px-1.5 sm:px-2.5 md:px-4
                      text-xs sm:text-sm font-medium
                      ${isActive 
                        ? 'bg-background text-foreground shadow-sm border border-border/50' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                      }
                    `}
                  >
                    {TabIcon && (
                      <TabIcon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${tab.color || ''} ${tab.label ? 'mr-1 sm:mr-1.5 md:mr-2' : ''}`} />
                    )}
                    <span className="hidden xs:inline">{tab.label}</span>
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Panel - Collapsible for filters when hidden */}
      {children && (
        <div className="lg:hidden border-t border-border/30">
          <details className="group">
            <summary className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-2">
              <span>Filters</span>
              <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-3 pb-2 sm:px-4 sm:pb-3 flex flex-wrap items-center gap-1.5 sm:gap-2">
              {children}
              {/* Mobile Clear Filters Button */}
              {onClearFilters && (filters && Object.values(filters).some(v => v)) && (
                <Button
                  onClick={onClearFilters}
                  variant="ghost"
                  size="sm"
                  className="h-7 sm:h-8 px-1.5 sm:px-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </details>
        </div>
      )}

      {/* Additional Content (e.g., timeline headers) */}
      {additionalContent}
    </div>
  );
}