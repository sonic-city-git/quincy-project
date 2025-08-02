import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Filter, X, Users, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PlannerFiltersProps {
  selectedOwner: string;
  onOwnerChange: (owner: string) => void;
  activeTab: 'equipment' | 'crew';
}

export function PlannerFilters({ 
  selectedOwner, 
  onOwnerChange, 
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

  const hasActiveFilters = selectedOwner;

  const clearAllFilters = () => {
    onOwnerChange('');
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
                1
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

        </div>
      )}
    </div>
  );
}