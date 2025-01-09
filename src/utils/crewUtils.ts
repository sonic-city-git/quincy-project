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

const getFolderPriority = (folderName: string | null) => {
  if (!folderName) return 4;

  switch (folderName.toLowerCase()) {
    case 'sonic city':
      return 1;
    case 'associate':
      return 2;
    default:
      return 3;
  }
};

export const sortCrewMembers = async (crewMembers: CrewMember[]) => {
  return [...crewMembers].sort((a, b) => {
    const aPriority = getFolderPriority(a.crew_folder?.name);
    const bPriority = getFolderPriority(b.crew_folder?.name);
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    // If same priority, sort alphabetically by name
    return a.name.localeCompare(b.name);
  });
};