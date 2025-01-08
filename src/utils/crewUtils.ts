import { CrewMember } from "@/types/crew";

export const getAllUniqueRoles = (crewMembers: CrewMember[]): string[] => {
  if (!crewMembers || !Array.isArray(crewMembers)) return [];
  
  return Array.from(
    new Set(
      crewMembers.flatMap((member) =>
        member.role ? member.role.split(", ").map((role) => role.toUpperCase()) : []
      )
    )
  ).sort();
};

export const filterCrewByRoles = (crewMembers: CrewMember[], selectedRoles: string[]): CrewMember[] => {
  if (selectedRoles.length === 0) return crewMembers;
  if (!crewMembers || !Array.isArray(crewMembers)) return [];
  
  return crewMembers.filter((member) =>
    member.role
      ? member.role
          .split(", ")
          .some((role) => selectedRoles.includes(role.toUpperCase()))
      : false
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