import { Search, Filter, X, CalendarDays, Clock, CheckCircle, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useProjects } from "@/hooks/useProjects";

// Filter types
export interface ProjectFilters {
  search: string;
  owner: string;
  status: string;
}

interface ProjectsHeaderProps {
  activeTab: 'all' | 'active' | 'completed' | 'draft';
  onTabChange: (tab: 'all' | 'active' | 'completed' | 'draft') => void;
  filters: ProjectFilters;
  onFiltersChange: (filters: ProjectFilters) => void;
  onAddClick?: () => void;
}

export function ProjectsHeader({
  activeTab,
  onTabChange,
  filters,
  onFiltersChange,
  onAddClick
}: ProjectsHeaderProps) {
  // Dynamic content based on project tab
  const getTabConfig = () => {
    switch (activeTab) {
      case 'active':
        return { title: 'Active Projects', icon: Clock, color: 'text-blue-500' };
      case 'completed':
        return { title: 'Completed Projects', icon: CheckCircle, color: 'text-green-500' };
      case 'draft':
        return { title: 'Draft Projects', icon: FileText, color: 'text-gray-500' };
      default:
        return { title: 'All Projects', icon: CalendarDays, color: 'text-purple-500' };
    }
  };

  const { title, icon: IconComponent, color: iconColor } = getTabConfig();

  // Get dynamic data from projects
  const { projects } = useProjects();

  // Extract unique statuses and owners from actual project data
  const statusOptions = useMemo(() => {
    if (!projects) return [];
    const statuses = projects
      .map(project => project.status)
      .filter((status, index, self) => status && self.indexOf(status) === index)
      .sort();
    return statuses;
  }, [projects]);

  const ownerOptions = useMemo(() => {
    if (!projects) return [];
    const owners = projects
      .map(project => project.owner?.name)
      .filter((owner, index, self) => owner && self.indexOf(owner) === index)
      .sort();
    return owners;
  }, [projects]);

  // Local search state for immediate UI feedback
  const [localSearchValue, setLocalSearchValue] = useState(filters.search || '');

  // Stable updateFilters function
  const updateFilters = useCallback((updates: Partial<ProjectFilters>) => {
    // Convert "all" values to empty strings for internal state
    const normalizedUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
      acc[key as keyof ProjectFilters] = value === 'all' ? '' : value;
      return acc;
    }, {} as Partial<ProjectFilters>);
    
    onFiltersChange({ ...filters, ...normalizedUpdates });
  }, [filters, onFiltersChange]);

  // Update local search when external filters change
  useEffect(() => {
    setLocalSearchValue(filters.search || '');
  }, [filters.search]);

  // Debounced search to prevent lag
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearchValue !== filters.search) {
        updateFilters({ search: localSearchValue });
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [localSearchValue, filters.search, updateFilters]);

  // Filter helpers
  const hasActiveFilters = (
    filters.search || 
    (filters.owner && filters.owner !== 'all') || 
    (filters.status && filters.status !== 'all')
  );

  const clearAllFilters = () => {
    setLocalSearchValue(''); // Clear local search state too
    onFiltersChange({
      search: '',
      owner: '',
      status: ''
    });
  };

  return (
    <div className="sticky top-[72px] z-40 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-sm">
      {/* Header with Title, Filters, and Tab Toggle */}
      <div className="flex items-center justify-between py-3 px-4 bg-background border-b border-border/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <IconComponent className={`h-5 w-5 ${iconColor}`} />
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          
          {/* Search and Filters */}
          <div className="flex items-center gap-2">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={localSearchValue}
                onChange={(e) => setLocalSearchValue(e.target.value)}
                className="pl-9 w-64 h-8"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-1">
              <Select value={filters.owner || 'all'} onValueChange={(value) => updateFilters({ owner: value })}>
                <SelectTrigger className="w-auto h-8 text-xs">
                  <SelectValue placeholder="Owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All owners</SelectItem>
                  {ownerOptions.map(owner => (
                    <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.status || 'all'} onValueChange={(value) => updateFilters({ status: value })}>
                <SelectTrigger className="w-auto h-8 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {statusOptions.map(status => (
                    <SelectItem key={status} value={status}>
                      {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* More Filters Button */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-2 relative">
                    <Filter className="h-4 w-4" />
                    {hasActiveFilters && (
                      <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center">
                        !
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64" align="end">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Advanced Filters</h4>
                      {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-auto p-1 text-xs">
                          Clear all
                        </Button>
                      )}
                    </div>
                    
                    {/* Advanced filters can be added here */}
                    <div className="text-sm text-muted-foreground">
                      More filter options coming soon...
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex items-center gap-1">
                {filters.search && (
                  <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                    Search: {filters.search.slice(0, 10)}{filters.search.length > 10 ? '...' : ''}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 ml-1 hover:bg-transparent"
                      onClick={() => {
                        setLocalSearchValue('');
                        updateFilters({ search: '' });
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}

                {filters.owner && filters.owner !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                    {filters.owner}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 ml-1 hover:bg-transparent"
                      onClick={() => updateFilters({ owner: '' })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}

                {filters.status && filters.status !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                    {filters.status ? filters.status.charAt(0).toUpperCase() + filters.status.slice(1) : 'Unknown'}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 ml-1 hover:bg-transparent"
                      onClick={() => updateFilters({ status: '' })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Add Button and Tab Toggle */}
        <div className="flex items-center gap-32">
          <Button size="sm" className="gap-1 h-6 px-1.5 text-xs" onClick={onAddClick}>
            <Plus className="h-3 w-3" />
            Add Project
          </Button>
          
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={activeTab === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('all')}
              className={`flex items-center gap-2 ${
                activeTab === 'all' ? 'bg-purple-100 text-purple-700' : ''
              }`}
            >
              <CalendarDays className="h-4 w-4" />
              All
            </Button>
            <Button
              variant={activeTab === 'active' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('active')}
              className={`flex items-center gap-2 ${
                activeTab === 'active' ? 'bg-blue-100 text-blue-700' : ''
              }`}
            >
              <Clock className="h-4 w-4" />
              Active
            </Button>
            <Button
              variant={activeTab === 'completed' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('completed')}
              className={`flex items-center gap-2 ${
                activeTab === 'completed' ? 'bg-green-100 text-green-700' : ''
              }`}
            >
              <CheckCircle className="h-4 w-4" />
              Completed
            </Button>
            <Button
              variant={activeTab === 'draft' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('draft')}
              className={`flex items-center gap-2 ${
                activeTab === 'draft' ? 'bg-gray-100 text-gray-700' : ''
              }`}
            >
              <FileText className="h-4 w-4" />
              Draft
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}