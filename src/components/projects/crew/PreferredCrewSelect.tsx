import { EntitySelect } from "@/components/shared/EntitySelect";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CrewMember } from "@/types/crew";

interface PreferredCrewSelectProps {
  roleId: string;
  preferredId: string | null;
  onUpdate: (crewId: string) => void;
}

export function PreferredCrewSelect({ roleId, preferredId, onUpdate }: PreferredCrewSelectProps) {
  const { data: crewMembers = [] } = useQuery({
    queryKey: ['crew-members', roleId],
    queryFn: async () => {
      console.log('Fetching crew members for role:', { roleId });
      
      const { data, error } = await supabase
        .from('crew_members')
        .select('*')
        .filter('roles', 'cs', `[{"id":"${roleId}"}]`);
      
      if (error) {
        console.error('Error fetching crew members:', error);
        throw error;
      }

      console.log('Received crew data:', data);

      const transformedData = (data || []).map(member => {
        const roles = Array.isArray(member.roles) 
          ? member.roles.map((role: any) => ({
              id: role.id || '',
              name: role.name || '',
              color: role.color || '',
              created_at: role.created_at
            }))
          : [];

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

      return transformedData.sort((a, b) => {
        const aIsSonicCity = a.crew_folder?.name === 'Sonic City';
        const bIsSonicCity = b.crew_folder?.name === 'Sonic City';
        
        if (aIsSonicCity && !bIsSonicCity) return -1;
        if (!aIsSonicCity && bIsSonicCity) return 1;
        return a.name.localeCompare(b.name);
      });
    }
  });

  return (
    <EntitySelect
      entities={crewMembers.map(crew => ({
        id: crew.id,
        name: crew.name
      }))}
      value={preferredId || ''}
      onValueChange={onUpdate}
      placeholder="Preferred crew"
    />
  );
}