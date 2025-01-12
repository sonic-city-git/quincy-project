import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Loader2 } from "lucide-react";

interface GroupSelectorProps {
  projectId: string;
  selectedGroupId: string | null;
  onGroupSelect: (groupId: string | null) => void;
}

export function GroupSelector({ projectId, selectedGroupId, onGroupSelect }: GroupSelectorProps) {
  const [groupSearch, setGroupSearch] = useState("");
  const [isGroupPopoverOpen, setIsGroupPopoverOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: equipmentGroups = [], isLoading } = useQuery({
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

  const createGroup = async (name: string) => {
    if (!name.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('project_equipment_groups')
        .insert({
          name,
          project_id: projectId,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Group created successfully",
      });

      queryClient.invalidateQueries({ queryKey: ['project-equipment-groups', projectId] });
      setGroupSearch("");
      setIsGroupPopoverOpen(false);
      if (data) onGroupSelect(data.id);
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Error",
        description: "Failed to create group",
        variant: "destructive",
      });
    }
  };

  const filteredGroups = equipmentGroups.filter(group => 
    group.name.toLowerCase().includes(groupSearch.toLowerCase())
  );

  if (isLoading || isLoadingProjectGroups) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading groups...</span>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Popover open={isGroupPopoverOpen} onOpenChange={setIsGroupPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isGroupPopoverOpen}
            className="w-[200px] justify-between"
          >
            {groupSearch || "Add new group..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput
              placeholder="Search or create..."
              value={groupSearch}
              onValueChange={setGroupSearch}
            />
            <CommandEmpty>
              {groupSearch && (
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => createGroup(groupSearch)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create "{groupSearch}"
                </Button>
              )}
            </CommandEmpty>
            {filteredGroups.length > 0 && (
              <CommandGroup>
                {filteredGroups.map(group => (
                  <CommandItem
                    key={group.id}
                    onSelect={() => createGroup(group.name)}
                  >
                    {group.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </Command>
        </PopoverContent>
      </Popover>

      <div className="flex gap-2 overflow-x-auto">
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
    </div>
  );
}