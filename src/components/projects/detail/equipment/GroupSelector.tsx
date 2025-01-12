import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface GroupSelectorProps {
  projectId: string;
  selectedGroupId: string | null;
  onGroupSelect: (groupId: string | null) => void;
}

export function GroupSelector({ projectId, selectedGroupId, onGroupSelect }: GroupSelectorProps) {
  const [groupSearch, setGroupSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const { data: equipmentGroups = [], isLoading: isLoadingGroups } = useQuery({
    queryKey: ['equipment-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment_groups')
        .select('*')
        .order('sort_order');
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: projectGroups = [], isLoading: isLoadingProjectGroups } = useQuery({
    queryKey: ['project-equipment-groups', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_equipment_groups')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId
  });

  if (isLoadingGroups || isLoadingProjectGroups) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading groups...</span>
      </div>
    );
  }

  const filteredGroups = groupSearch.trim() === "" 
    ? equipmentGroups 
    : equipmentGroups.filter(group => 
        group.name.toLowerCase().includes(groupSearch.toLowerCase())
      );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {projectGroups.map(group => (
          <Button
            key={group.id}
            variant={selectedGroupId === group.id ? "default" : "outline"}
            onClick={() => onGroupSelect(group.id === selectedGroupId ? null : group.id)}
            className="whitespace-nowrap"
          >
            {group.name}
          </Button>
        ))}
      </div>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="w-[200px]">
            <Input
              placeholder="Add group"
              value={groupSearch}
              onChange={(e) => setGroupSearch(e.target.value)}
              onFocus={() => setIsOpen(true)}
              className="bg-zinc-800/50"
            />
          </div>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[200px] p-0" 
          align="start"
        >
          <div className="py-2">
            {filteredGroups.map(group => (
              <button
                key={group.id}
                className="w-full px-4 py-2 text-left hover:bg-accent hover:text-accent-foreground text-sm"
                onClick={async () => {
                  const { error } = await supabase
                    .from('project_equipment_groups')
                    .insert({
                      project_id: projectId,
                      name: group.name,
                      sort_order: group.sort_order
                    });
                  
                  if (error) {
                    console.error('Error adding group:', error);
                  }
                  setIsOpen(false);
                  setGroupSearch("");
                }}
              >
                + {group.name}
              </button>
            ))}
            {filteredGroups.length === 0 && (
              <div className="px-4 py-2 text-sm text-muted-foreground">
                No groups found
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}