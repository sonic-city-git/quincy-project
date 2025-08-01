import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar/Calendar";
import { Badge } from "@/components/ui/badge";
import { Filter, Calendar as CalendarIcon, X, Users, Package } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PlannerFiltersProps {
  selectedOwner: string;
  onOwnerChange: (owner: string) => void;
  dateRange?: {
    from: Date;
    to: Date;
  };
  onDateRangeChange: (range: { from: Date; to: Date } | undefined) => void;
  activeTab: 'equipment' | 'crew';
}

export function PlannerFilters({ 
  selectedOwner, 
  onOwnerChange, 
  dateRange, 
  onDateRangeChange,
  activeTab 
}: PlannerFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  // Get owners for filtering
  const { data: owners } = useQuery({
    queryKey: ['project-owners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          owner_id,
          owner:crew_members!projects_owner_id_fkey (
            id,
            name,
            email
          )
        `)
        .not('owner_id', 'is', null);
      
      if (error) throw error;
      
      // Get unique owners
      const ownerMap = new Map();
      data?.forEach(project => {
        if (project.owner_id && !ownerMap.has(project.owner_id)) {
          ownerMap.set(project.owner_id, {
            id: project.owner_id,
            name: project.owner?.name || 'Unknown',
            email: project.owner?.email
          });
        }
      });
      
      return Array.from(ownerMap.values());
    }
  });

  const hasActiveFilters = selectedOwner || dateRange;

  const clearAllFilters = () => {
    onOwnerChange('');
    onDateRangeChange(undefined);
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={showFilters} onOpenChange={setShowFilters}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge variant="destructive" className="ml-2 px-1.5 py-0.5 text-xs">
                {[selectedOwner, dateRange].filter(Boolean).length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Filters</h3>
                {hasActiveFilters && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearAllFilters}
                    className="h-auto p-1 text-muted-foreground hover:text-foreground"
                  >
                    Clear all
                  </Button>
                )}
              </div>

              {/* Owner Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Owner</label>
                <Select value={selectedOwner} onValueChange={onOwnerChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All owners" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All owners</SelectItem>
                    {owners?.map(owner => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
                            </>
                          ) : (
                            format(dateRange.from, "MMM dd, yyyy")
                          )
                        ) : (
                          <span>Select dates</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selectedDates={dateRange ? [dateRange.from, dateRange.to] : []}
                        onDayClick={(day) => {
                          if (!dateRange?.from) {
                            onDateRangeChange({ from: day, to: day });
                          } else if (!dateRange.to && day > dateRange.from) {
                            onDateRangeChange({ from: dateRange.from, to: day });
                          } else {
                            onDateRangeChange({ from: day, to: day });
                          }
                        }}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                  {dateRange && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onDateRangeChange(undefined)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Tab-specific filters */}
              {activeTab === 'equipment' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Equipment Type
                  </label>
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="All equipment (Coming soon)" />
                    </SelectTrigger>
                  </Select>
                </div>
              )}

              {activeTab === 'crew' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Crew Role
                  </label>
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="All roles (Coming soon)" />
                    </SelectTrigger>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1">
          {selectedOwner && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Owner
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto p-0 ml-1 hover:bg-transparent"
                onClick={() => onOwnerChange('')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {dateRange && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto p-0 ml-1 hover:bg-transparent"
                onClick={() => onDateRangeChange(undefined)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}