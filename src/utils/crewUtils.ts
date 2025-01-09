import { CrewMember } from "@/types/crew";
import { supabase } from "@/integrations/supabase/client";

export const getAllUniqueRoles = (crewMembers: CrewMember[]) => {
  const roles = new Set<string>();
  crewMembers.forEach(member => {
    member.roles?.forEach(role => {
      if (role.name) {
        roles.add(role.name);
      }
    });
  });
  return Array.from(roles);
};

export const filterCrewByRoles = (crewMembers: CrewMember[], selectedRoles: string[]) => {
  if (selectedRoles.length === 0) return crewMembers;
  
  return crewMembers.filter(member => 
    member.roles?.some(role => 
      role.name && selectedRoles.includes(role.name)
    )
  );
};

const getFolderPriority = async (folderId: string | null) => {
  if (!folderId) return 4;

  const { data: folder } = await supabase
    .from('crew_folders')
    .select('name')
    .eq('id', folderId)
    .single();

  if (!folder) return 3;

  switch (folder.name.toLowerCase()) {
    case 'sonic city':
      return 1;
    case 'associate':
      return 2;
    default:
      return 3;
  }
};

export const sortCrewMembers = async (crewMembers: CrewMember[]) => {
  // Create a map to store folder priorities
  const priorityMap = new Map<string, number>();

  // Fetch all folder priorities at once
  await Promise.all(
    crewMembers.map(async (member) => {
      const priority = await getFolderPriority(member.folder_id);
      if (member.folder_id) {
        priorityMap.set(member.folder_id, priority);
      }
    })
  );

  return [...crewMembers].sort((a, b) => {
    const aPriority = a.folder_id ? priorityMap.get(a.folder_id) ?? 4 : 4;
    const bPriority = b.folder_id ? priorityMap.get(b.folder_id) ?? 4 : 4;
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    // If same priority, sort alphabetically by name
    return a.name.localeCompare(b.name);
  });
};