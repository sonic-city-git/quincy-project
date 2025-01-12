import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface GroupSelectorProps {
  projectId: string;
  selectedGroupId: string | null;
  onGroupSelect: (groupId: string | null) => void;
}

export function GroupSelector({ projectId, selectedGroupId, onGroupSelect }: GroupSelectorProps) {
  const [groupSearch, setGroupSearch] = useState("");

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
    <div className="flex gap-2">
      <div className="w-[200px]">
        <Input
          placeholder="Search groups..."
          value={groupSearch}
          onChange={(e) => setGroupSearch(e.target.value)}
          className="bg-zinc-800/50"
        />
      </div>

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