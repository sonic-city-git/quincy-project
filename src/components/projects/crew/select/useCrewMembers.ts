import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CrewMember, CrewRole } from "@/types/crew";
import { Json } from "@/integrations/supabase/types";

// Type guard for crew role JSON data
const isValidRole = (value: unknown): value is CrewRole => {
  if (!value || typeof value !== 'object') return false;
  
  const role = value as Record<string, unknown>;
  return (
    typeof role.id === 'string' &&
    typeof role.name === 'string' &&
    (role.color === null || typeof role.color === 'string')
  );
};

// Type guard for crew folder JSON data
const isValidCrewFolder = (value: unknown): value is { id: string; name: string; created_at: string } => {
  if (!value || typeof value !== 'object') return false;
  
  const folder = value as Record<string, unknown>;
  return (
    typeof folder.id === 'string' &&
    typeof folder.name === 'string' &&
    typeof folder.created_at === 'string'
  );
};

const getFolderPriority = (folderName: string | null) => {
  if (!folderName) return 4;
  const name = folderName.toLowerCase();
  if (name === 'sonic city') return 1;
  if (name === 'associates') return 2;
  if (name === 'freelance') return 3;
  return 4;
};

export const useCrewMembers = (roleName: string) => {
  return useQuery({
    queryKey: ['crew-members', roleName],
    queryFn: async () => {
      console.log('Fetching crew members for role:', roleName);
      
      const { data, error } = await supabase
        .from('crew_members')
        .select('*');
      
      if (error) {
        console.error('Error fetching crew members:', error);
        throw error;
      }

      if (!data) {
        console.log('No crew members found');
        return [];
      }

      console.log('Raw crew members data:', data);

      // Transform and validate the data
      const validMembers = data.map(member => {
        // Parse and validate roles
        const validRoles: CrewRole[] = [];
        if (Array.isArray(member.roles)) {
          member.roles.forEach((role: unknown) => {
            if (isValidRole(role)) {
              validRoles.push(role);
            }
          });
        }

        // Validate and transform crew_folder
        const crewFolder = member.crew_folder && isValidCrewFolder(member.crew_folder)
          ? {
              id: member.crew_folder.id,
              name: member.crew_folder.name,
              created_at: member.crew_folder.created_at
            }
          : null;

        return {
          id: member.id,
          name: member.name,
          email: member.email,
          phone: member.phone,
          created_at: member.created_at,
          roles: validRoles,
          crew_folder: crewFolder
        } satisfies CrewMember;
      });

      console.log('Processed crew members:', validMembers);

      // Filter members by role
      const filteredMembers = validMembers.filter(member => 
        member.roles?.some(role => role.name === roleName)
      );

      // Sort members by folder priority (Sonic City first)
      const sortedMembers = filteredMembers.sort((a, b) => {
        const aPriority = getFolderPriority(a.crew_folder?.name);
        const bPriority = getFolderPriority(b.crew_folder?.name);
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        // If same priority, sort alphabetically by name
        return a.name.localeCompare(b.name);
      });

      console.log('Filtered and sorted crew members:', sortedMembers);
      return sortedMembers;
    },
  });
};