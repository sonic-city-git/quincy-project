import { RolesHeader } from "./RolesHeader";
import { RatesList } from "./RatesList";
import { RoleSelectionActions } from "./RoleSelectionActions";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface RolesSectionProps {
  projectId: string;
}

export function RolesSection({ projectId }: RolesSectionProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: projectRoles, refetch: refetchRoles } = useQuery({
    queryKey: ['project-roles', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_roles')
        .select(`
          *,
          crew_roles (
            id,
            name,
            color
          )
        `)
        .eq('project_id', projectId);
      
      if (error) throw error;
      return data;
    },
  });

  const handleItemSelect = (roleId: string) => {
    setSelectedItems((prev) => {
      if (prev.includes(roleId)) {
        return prev.filter((id) => id !== roleId);
      }
      return [...prev, roleId];
    });
  };

  const handleAddClick = () => {
    toast({
      title: "Add role",
      description: "Add role functionality coming soon",
    });
  };

  const handleEdit = () => {
    toast({
      title: "Edit role",
      description: "Edit role functionality coming soon",
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-zinc-900/50 rounded-lg p-3">
        <RolesHeader onAddClick={handleAddClick} />
        <RoleSelectionActions 
          selectedItems={selectedItems}
          onEdit={handleEdit}
        />
        <div className="grid gap-1.5">
          <RatesList
            projectRoles={projectRoles || []}
            selectedItems={selectedItems}
            onUpdate={() => refetchRoles()}
            onItemSelect={handleItemSelect}
          />
        </div>
      </div>
    </div>
  );
}