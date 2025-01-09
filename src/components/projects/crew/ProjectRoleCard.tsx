import { Card } from "@/components/ui/card";
import { RoleInfo } from "./RoleInfo";
import { EntitySelect } from "@/components/shared/EntitySelect";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CrewMember, CrewRole } from "@/types/crew";

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
  const { data: crewMembers = [] } = useQuery({
    queryKey: ['crew-members', id],
    queryFn: async () => {
      console.log('Fetching crew members for role:', { id, name });
      
      // Query crew members where roles array contains the role id
      const { data, error } = await supabase
        .from('crew_members')
        .select('*')
        .filter('roles', 'cs', `[{"id":"${id}"}]`);
      
      if (error) {
        console.error('Error fetching crew members:', error);
        throw error;
      }

      console.log('Received crew data:', data);

      // Transform and sort crew members
      const transformedData = (data || []).map(member => {
        // Transform roles from Json to CrewRole[]
        const roles = Array.isArray(member.roles) 
          ? member.roles.map((role: any) => ({
              id: role.id || '',
              name: role.name || '',
              color: role.color || '',
              created_at: role.created_at
            }))
          : [];

        // Transform crew_folder from Json to the expected type
        const crewFolder = member.crew_folder && typeof member.crew_folder === 'object'
          ? {
              id: (member.crew_folder as any).id || '',
              name: (member.crew_folder as any).name || '',
              created_at: (member.crew_folder as any).created_at || ''
            }
          : null;

        return {
          id: member.id,
          name: member.name,
          email: member.email,
          phone: member.phone,
          created_at: member.created_at,
          crew_folder: crewFolder,
          roles: roles
        } as CrewMember;
      });

      // Sort crew members with Sonic City first
      return transformedData.sort((a, b) => {
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
      <div className="flex items-center">
        <RoleInfo color={color} name={name} />
        <div className="grid grid-cols-[200px,200px,1fr] gap-6">
          <span className="text-sm pl-1 flex items-center -ml-[10px]">{dailyRate || '-'}</span>
          <span className="text-sm pl-1 flex items-center">{hourlyRate || '-'}</span>
          <div className="-ml-[50px]">
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
      </div>
    </Card>
  );
}