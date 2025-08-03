import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FolderOpen, 
  Users, 
  Package, 
  Search,
  ArrowRight,
  Building
} from "lucide-react";
import { SearchResult, GlobalSearchResults } from "@/hooks/useGlobalSearch";

interface GlobalSearchResultsProps {
  results: GlobalSearchResults;
  isLoading: boolean;
  query: string;
}

interface SearchResultItemProps {
  result: SearchResult;
  onItemClick: () => void;
  onWarningClick?: () => void;
}

function SearchResultItem({ result, onItemClick, onWarningClick }: SearchResultItemProps) {
  const getIcon = () => {
    switch (result.type) {
      case 'project':
        return <FolderOpen className="h-4 w-4 text-blue-500" />;
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
      default:
        return '';
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border/50">
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
              className={`px-2 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${getWarningColor()}`}
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
  onWarningClick
}: {
  title: string;
  icon: any;
  results: SearchResult[];
  onItemClick: (result: SearchResult) => void;
  onWarningClick: (result: SearchResult) => void;
}) {
  if (results.length === 0) return null;

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

  const handleItemClick = (result: SearchResult) => {
    navigate(result.route);
  };

  const handleWarningClick = (result: SearchResult) => {
    if (result.warning?.route) {
      navigate(result.warning.route);
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
            <FolderOpen className="h-3 w-3" />
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
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Search className="h-4 w-4" />
          <span className="text-sm">
            Found {results.total} result{results.total !== 1 ? 's' : ''} for "{query}"
          </span>
        </div>
      </div>

      {/* Results by Category */}
      <div className="space-y-6">
        <SearchSection
          title="Projects"
          icon={FolderOpen}
          results={results.projects}
          onItemClick={handleItemClick}
          onWarningClick={handleWarningClick}
        />
        
        <SearchSection
          title="Crew Members"
          icon={Users}
          results={results.crew}
          onItemClick={handleItemClick}
          onWarningClick={handleWarningClick}
        />
        
        <SearchSection
          title="Equipment"
          icon={Package}
          results={results.equipment}
          onItemClick={handleItemClick}
          onWarningClick={handleWarningClick}
        />
      </div>
    </div>
  );
}