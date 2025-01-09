import { CrewMember } from "@/types/crew";

export const getAllUniqueRoles = (crewMembers: CrewMember[]): string[] => {
  if (!crewMembers || !Array.isArray(crewMembers)) return [];
  
  const roleIds = new Set<string>();
  crewMembers.forEach(member => {
    member.crew_member_roles?.forEach(role => {
      if (role.role_id) {
        roleIds.add(role.role_id);
      }
    });
  });
  
  return Array.from(roleIds).sort();
};

export const filterCrewByRoles = (crewMembers: CrewMember[], selectedRoles: string[]): CrewMember[] => {
  if (selectedRoles.length === 0) return crewMembers;
  if (!crewMembers || !Array.isArray(crewMembers)) return [];
  
  return crewMembers.filter((member) =>
    member.crew_member_roles?.some(role => 
      role.role_id && selectedRoles.includes(role.role_id)
    ) ?? false
  );
};

export const sortCrewMembers = (crewMembers: CrewMember[]): CrewMember[] => {
  if (!crewMembers || !Array.isArray(crewMembers)) return [];
  
  return [...crewMembers].sort((a, b) => {
    // First sort by folder (Sonic City first, then others)
    if (a.folder === "Sonic City" && b.folder !== "Sonic City") return -1;
    if (a.folder !== "Sonic City" && b.folder === "Sonic City") return 1;
    
    // If folders are the same, sort alphabetically by name
    if (a.folder === b.folder) {
      return a.name.localeCompare(b.name);
    }
    
    // If folders are different (and neither is Sonic City), sort alphabetically by folder
    return a.folder.localeCompare(b.folder);
  });
};