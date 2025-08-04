import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FolderOpen, 
  Users, 
  Package, 
  Search,
  ArrowRight,
  Building,
  Eye,
  Mail,
  Calendar
} from "lucide-react";
import { SearchResult, GlobalSearchResults } from "@/hooks/useGlobalSearch";

interface GlobalSearchResultsProps {
  results: GlobalSearchResults;
  isLoading: boolean;
  query: string;
}

interface FocusableItem {
  resultIndex: number;
  element: 'main' | 'warning' | 'availability' | 'action';
  result: SearchResult;
}

interface SearchResultItemProps {
  result: SearchResult;
  onItemClick: () => void;
  onWarningClick?: () => void;
  onAvailabilityClick?: () => void;
  onPrimaryActionClick?: () => void;
  focusedElement?: 'main' | 'warning' | 'availability' | 'action' | null;
}

function SearchResultItem({ result, onItemClick, onWarningClick, onAvailabilityClick, onPrimaryActionClick, focusedElement }: SearchResultItemProps) {
  const getIcon = () => {
    switch (result.type) {
      case 'project':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'crew':
        return <Users className="h-4 w-4 text-green-500" />;
      case 'equipment':
        return <Package className="h-4 w-4 text-purple-500" />;
    }
  };



  const getWarningColor = () => {
    if (!result.warning) return '';
    switch (result.warning.type) {
      case 'overbooked':
        return 'text-red-500 bg-red-500/10 border-red-500/20 hover:bg-red-500/20';
      case 'fully_booked':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20';
      case 'out_of_stock':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'low_stock':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'double_booked':
        return 'text-red-500 bg-red-500/10 border-red-500/20 hover:bg-red-500/20';
      case 'missing_roles':
        return 'text-orange-500 bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20';
      case 'equipment_conflicts':
        return 'text-red-500 bg-red-500/10 border-red-500/20 hover:bg-red-500/20';
      default:
        return '';
    }
  };

  const getMainItemClasses = () => {
    const baseClasses = "flex items-center gap-3 p-3 rounded-lg transition-colors border";
    const hoverClasses = "hover:bg-muted/50 hover:border-border/50";
    const focusClasses = focusedElement === 'main' 
      ? "bg-blue-500/20 border-blue-500/50 ring-2 ring-blue-500/30" 
      : "border-transparent";
    
    return `${baseClasses} ${hoverClasses} ${focusClasses}`;
  };

  return (
    <div className={getMainItemClasses()}>
      {/* Avatar/Icon */}
      <div className="flex-shrink-0">
        {result.avatar_url ? (
          <Avatar className="h-10 w-10">
            <AvatarImage src={result.avatar_url} alt={result.title} />
            <AvatarFallback className="text-xs">
              {result.title.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div 
            className="h-10 w-10 rounded-lg flex items-center justify-center"
            style={result.color ? {
              backgroundColor: result.color + '20',
              border: `1px solid ${result.color}40`
            } : undefined}
          >
            {getIcon()}
          </div>
        )}
      </div>

      {/* Content - Clickable */}
      <div 
        className="flex-1 min-w-0 cursor-pointer"
        onClick={onItemClick}
      >
        <p className="font-medium text-sm truncate">{result.title}</p>
        {result.subtitle && (
          <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
        )}
        {/* Role badges for crew members */}
        {result.type === 'crew' && result.roles && result.roles.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-1">
            {result.roles.map((role, index) => (
              <Badge 
                key={index} 
                className={getRoleBadgeClasses(role.name)}
              >
                {role.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Warning Column - Clickable if actionable */}
      {result.warning && (
        <div className="flex-shrink-0 min-w-0 max-w-[200px]">
          {result.warning.route && onWarningClick ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onWarningClick();
              }}
              className={`px-2 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${getWarningColor()} ${
                focusedElement === 'warning' ? 'ring-2 ring-blue-500/50' : ''
              }`}
            >
              ⚠️ {result.warning.text}
            </button>
          ) : (
            <div className={`px-2 py-1 rounded-md text-xs font-medium border ${getWarningColor()}`}>
              ⚠️ {result.warning.text}
            </div>
          )}
        </div>
      )}

      {/* View Availability Column */}
      {result.availabilityAction && onAvailabilityClick && (
        <div className="flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAvailabilityClick();
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors cursor-pointer ${
              focusedElement === 'availability' ? 'ring-2 ring-blue-500/50 bg-muted/50' : ''
            }`}
          >
            <Eye className="h-3 w-3 inline mr-1" />
            View Availability
          </button>
        </div>
      )}

      {/* Action Column */}
      {result.primaryAction && onPrimaryActionClick && (
        <div className="flex-shrink-0">
          {result.primaryAction.type === 'email' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrimaryActionClick();
              }}
              className={`p-1.5 rounded-md border border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors cursor-pointer ${
                focusedElement === 'action' ? 'ring-2 ring-blue-500/50 bg-muted/50' : ''
              }`}
              title="Send Email"
            >
              <Mail className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Arrow */}
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

function SearchSection({ 
  title, 
  icon: Icon, 
  results, 
  onItemClick,
  onWarningClick,
  onAvailabilityClick,
  onPrimaryActionClick,
  focusedItems,
  allResults
}: {
  title: string;
  icon: any;
  results: SearchResult[];
  onItemClick: (result: SearchResult) => void;
  onWarningClick: (result: SearchResult) => void;
  onAvailabilityClick: (result: SearchResult) => void;
  onPrimaryActionClick: (result: SearchResult) => void;
  focusedItems: FocusableItem[];
  allResults: SearchResult[];
}) {
  if (results.length === 0) return null;

  const getFocusedElement = (result: SearchResult) => {
    const globalIndex = allResults.findIndex(r => r.type === result.type && r.id === result.id);
    const focused = focusedItems.find(item => item.resultIndex === globalIndex);
    return focused?.element || null;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">
          {title} ({results.length})
        </h3>
      </div>
      <div className="space-y-1">
        {results.map((result) => (
          <SearchResultItem
            key={`${result.type}-${result.id}`}
            result={result}
            onItemClick={() => onItemClick(result)}
            onWarningClick={result.warning?.route ? () => onWarningClick(result) : undefined}
            onAvailabilityClick={result.availabilityAction ? () => onAvailabilityClick(result) : undefined}
            onPrimaryActionClick={result.primaryAction ? () => onPrimaryActionClick(result) : undefined}
            focusedElement={getFocusedElement(result)}
          />
        ))}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <div className="space-y-2">
            {[1, 2].map((j) => (
              <div key={j} className="flex items-center gap-3 p-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function GlobalSearchResults({ results, isLoading, query }: GlobalSearchResultsProps) {
  const navigate = useNavigate();
  const [currentFocusIndex, setCurrentFocusIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Create flat array of all results
  const allResults = [...results.projects, ...results.crew, ...results.equipment];

  // Create flat array of all focusable items
  const focusableItems: FocusableItem[] = [];
  allResults.forEach((result, index) => {
    // Main item is always focusable
    focusableItems.push({ resultIndex: index, element: 'main', result });
    
    // Add warning button if it exists and is clickable
    if (result.warning?.route) {
      focusableItems.push({ resultIndex: index, element: 'warning', result });
    }
    
    // Add availability button if it exists
    if (result.availabilityAction) {
      focusableItems.push({ resultIndex: index, element: 'availability', result });
    }
    
    // Add action button if it exists
    if (result.primaryAction) {
      focusableItems.push({ resultIndex: index, element: 'action', result });
    }
  });

  // Reset focus when query changes or results load
  useEffect(() => {
    setCurrentFocusIndex(-1);
  }, [query, results.total]);

  // Auto-focus container when search results appear to capture Tab navigation
  useEffect(() => {
    if (query && query.length >= 2 && focusableItems.length > 0 && containerRef.current) {
      // Set tabIndex to make container focusable but not visually focused
      containerRef.current.setAttribute('tabindex', '-1');
      // Focus the container to ensure our keyboard handler gets priority
      containerRef.current.focus({ preventScroll: true });
    }
  }, [query, focusableItems.length]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if search results are visible and there are focusable items
      if (!query || query.length < 2 || focusableItems.length === 0) return;
      
      // Don't interfere if user is typing in an input field (except when search results are focused)
      const activeElement = document.activeElement;
      const isTypingInInput = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.getAttribute('contenteditable') === 'true'
      );
      
      // Allow Tab navigation when container is focused or when we have an active focus index
      const isSearchResultsContext = activeElement === containerRef.current || currentFocusIndex >= 0;

      if (e.key === 'Tab' && (!isTypingInInput || isSearchResultsContext)) {
        e.preventDefault();
        e.stopPropagation(); // Prevent normal tab order
        
        if (e.shiftKey) {
          // Shift+Tab: previous item
          setCurrentFocusIndex(prev => {
            if (prev <= 0) return focusableItems.length - 1;
            return prev - 1;
          });
        } else {
          // Tab: next item or start navigation if none focused
          setCurrentFocusIndex(prev => {
            if (prev === -1) return 0; // Start at first item
            if (prev >= focusableItems.length - 1) return 0;
            return prev + 1;
          });
        }
      } else if (e.key === 'Enter' && currentFocusIndex >= 0 && !isTypingInInput) {
        e.preventDefault();
        const focusedItem = focusableItems[currentFocusIndex];
        
        switch (focusedItem.element) {
          case 'main':
            handleItemClick(focusedItem.result);
            break;
          case 'warning':
            handleWarningClick(focusedItem.result);
            break;
          case 'availability':
            handleAvailabilityClick(focusedItem.result);
            break;
          case 'action':
            handlePrimaryActionClick(focusedItem.result);
            break;
        }
      } else if (e.key === 'Escape') {
        // Reset focus when ESC is pressed
        setCurrentFocusIndex(-1);
      }
    };

    document.addEventListener('keydown', handleKeyDown, true); // Use capture phase for priority
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [query, focusableItems, currentFocusIndex]);

  // Get currently focused items for highlighting
  const getCurrentlyFocused = (): FocusableItem[] => {
    if (currentFocusIndex >= 0 && currentFocusIndex < focusableItems.length) {
      return [focusableItems[currentFocusIndex]];
    }
    return [];
  };

  const handleItemClick = (result: SearchResult) => {
    navigate(result.route);
  };

  const handleWarningClick = (result: SearchResult) => {
    if (result.warning?.route) {
      navigate(result.warning.route);
    }
  };

  const handleAvailabilityClick = (result: SearchResult) => {
    if (result.availabilityAction?.route) {
      navigate(result.availabilityAction.route);
    }
  };

  const handlePrimaryActionClick = (result: SearchResult) => {
    if (result.primaryAction?.type === 'email' && result.primaryAction.href) {
      window.location.href = result.primaryAction.href;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Search className="h-4 w-4" />
          <span className="text-sm">Searching for "{query}"...</span>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (!query || query.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground">Global Search</h3>
        <p className="text-sm text-muted-foreground/70 max-w-md">
          Search across projects, crew members, and equipment. Type at least 2 characters to begin.
        </p>
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground/60">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Projects</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>Crew</span>
          </div>
          <div className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            <span>Equipment</span>
          </div>
        </div>
      </div>
    );
  }

  if (results.total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground">No results found</h3>
        <p className="text-sm text-muted-foreground/70">
          No projects, crew members, or equipment found matching "{query}".
        </p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="space-y-6 outline-none" 
      onKeyDown={(e) => {
        // Immediate Tab capture for search results
        if (e.key === 'Tab' && focusableItems.length > 0) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      {/* Search Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Search className="h-4 w-4" />
          <span className="text-sm">
            Found {results.total} result{results.total !== 1 ? 's' : ''} for "{query}"
          </span>
        </div>
        {focusableItems.length > 0 && (
          <div className="text-xs text-muted-foreground/60">
            {currentFocusIndex === -1 ? 'Press Tab to navigate' : 'Tab/Shift+Tab to navigate'} • Enter to select
          </div>
        )}
      </div>

      {/* Results by Category */}
      <div className="space-y-6">
        <SearchSection
          title="Projects"
          icon={Calendar}
          results={results.projects}
          onItemClick={handleItemClick}
          onWarningClick={handleWarningClick}
          onAvailabilityClick={handleAvailabilityClick}
          onPrimaryActionClick={handlePrimaryActionClick}
          focusedItems={getCurrentlyFocused()}
          allResults={allResults}
        />
        
        <SearchSection
          title="Crew Members"
          icon={Users}
          results={results.crew}
          onItemClick={handleItemClick}
          onWarningClick={handleWarningClick}
          onAvailabilityClick={handleAvailabilityClick}
          onPrimaryActionClick={handlePrimaryActionClick}
          focusedItems={getCurrentlyFocused()}
          allResults={allResults}
        />
        
        <SearchSection
          title="Equipment"
          icon={Package}
          results={results.equipment}
          onItemClick={handleItemClick}
          onWarningClick={handleWarningClick}
          onAvailabilityClick={handleAvailabilityClick}
          onPrimaryActionClick={handlePrimaryActionClick}
          focusedItems={getCurrentlyFocused()}
          allResults={allResults}
        />
      </div>
    </div>
  );
}