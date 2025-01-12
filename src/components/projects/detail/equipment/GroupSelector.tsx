import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus } from "lucide-react";
import { create } from "domain";

interface GroupSelectorProps {
  projectId: string;
}

export function GroupSelector({ projectId }: GroupSelectorProps) {
  const [groupSearch, setGroupSearch] = useState("");
  const [isGroupPopoverOpen, setIsGroupPopoverOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch equipment groups
  const { data: equipmentGroups = [] } = useQuery({
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

  // Fetch project equipment groups
  const { data: projectGroups = [] } = useQuery({
    queryKey: ['project-equipment-groups', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_equipment_groups')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Create new group
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
      setSelectedGroupId(data.id);
      return data;
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Error",
        description: "Failed to create group",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex gap-2">
      <Popover open={isGroupPopoverOpen} onOpenChange={setIsGroupPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isGroupPopoverOpen}
            className="w-full justify-between"
          >
            {groupSearch || "Search or create a group..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput
              placeholder="Type to search or create..."
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
                  Create new group "{groupSearch}"
                </Button>
              )}
            </CommandEmpty>
            <CommandGroup>
              {equipmentGroups
                .filter(group => 
                  group.name.toLowerCase().includes(groupSearch.toLowerCase())
                )
                .map(group => (
                  <CommandItem
                    key={group.id}
                    onSelect={() => createGroup(group.name)}
                  >
                    {group.name}
                  </CommandItem>
                ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      <div className="flex gap-2 overflow-x-auto">
        {projectGroups.map(group => (
          <Button
            key={group.id}
            variant={selectedGroupId === group.id ? "default" : "outline"}
            onClick={() => setSelectedGroupId(group.id === selectedGroupId ? null : group.id)}
            className="whitespace-nowrap"
          >
            {group.name}
          </Button>
        ))}
      </div>
    </div>
  );
}