import { Card } from "@/components/ui/card";
import { RoleInfo } from "./RoleInfo";
import { EntitySelect } from "@/components/shared/EntitySelect";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProjectRoleCardProps {
  id: string;
  projectId: string;
  name: string;
  color: string;
  dailyRate?: number | null;
  hourlyRate?: number | null;
  preferredId?: string | null;
  onUpdate?: () => void;
}

export function ProjectRoleCard({ 
  id,
  projectId,
  name, 
  color, 
  dailyRate,
  hourlyRate,
  preferredId,
  onUpdate
}: ProjectRoleCardProps) {
  // Fetch crew members with this role
  const { data: crewMembers = [] } = useQuery({
    queryKey: ['crew-members', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_members')
        .select('*')
        .contains('roles', [{ id, name }]);
      
      if (error) throw error;

      // Sort crew members with Sonic City first
      return data.sort((a, b) => {
        const aIsSonicCity = a.crew_folder?.name === 'Sonic City';
        const bIsSonicCity = b.crew_folder?.name === 'Sonic City';
        
        if (aIsSonicCity && !bIsSonicCity) return -1;
        if (!aIsSonicCity && bIsSonicCity) return 1;
        return a.name.localeCompare(b.name);
      });
    }
  });

  // Handle preferred crew member change
  const handlePreferredChange = async (crewId: string) => {
    const { error } = await supabase
      .from('project_roles')
      .update({ preferred_id: crewId })
      .eq('project_id', projectId)
      .eq('role_id', id);

    if (error) {
      console.error('Error updating preferred crew member:', error);
      return;
    }

    if (onUpdate) {
      onUpdate();
    }
  };

  return (
    <Card className="p-2">
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <RoleInfo color={color} name={name} />
          <div className="flex items-center gap-6">
            <span className="w-24 text-sm">{dailyRate || '-'}</span>
            <span className="w-24 text-sm">{hourlyRate || '-'}</span>
          </div>
        </div>
        <div className="w-[200px]">
          <EntitySelect
            entities={crewMembers.map(crew => ({
              id: crew.id,
              name: crew.name
            }))}
            value={preferredId || ''}
            onValueChange={handlePreferredChange}
            placeholder="Preferred crew"
          />
        </div>
      </div>
    </Card>
  );
}