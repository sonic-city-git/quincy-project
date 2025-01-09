import { CrewMember } from "@/types/crew";

export const getAllUniqueRoles = (crewMembers: CrewMember[]) => {
  const roles = new Set<string>();
  crewMembers.forEach(member => {
    member.crew_member_roles?.forEach(role => {
      if (role.crew_roles?.name) {
        roles.add(role.crew_roles.name);
      }
    });
  });
  return Array.from(roles);
};

export const filterCrewByRoles = (crewMembers: CrewMember[], selectedRoles: string[]) => {
  if (selectedRoles.length === 0) return crewMembers;
  
  return crewMembers.filter(member => 
    member.crew_member_roles?.some(role => 
      role.crew_roles?.name && selectedRoles.includes(role.crew_roles.name)
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

export const sortCrewMembers = (crewMembers: CrewMember[]) => {
  return [...crewMembers].sort((a, b) => {
    // First, sort by folder priority
    const aFolder = a.folder?.toLowerCase() || null;
    const bFolder = b.folder?.toLowerCase() || null;
    const aPriority = getFolderPriority(aFolder);
    const bPriority = getFolderPriority(bFolder);
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    // If same priority, sort alphabetically by name
    return a.name.localeCompare(b.name);
  });
};