import { CrewMember } from "@/types/crew";

export const getAllUniqueRoles = (crewMembers: CrewMember[]): string[] => {
  return Array.from(
    new Set(
      crewMembers.flatMap((member) =>
        member.role.split(", ").map((role) => role.toUpperCase())
      )
    )
  ).sort();
};

export const filterCrewByRoles = (crewMembers: CrewMember[], selectedRoles: string[]): CrewMember[] => {
  if (selectedRoles.length === 0) return crewMembers;
  
  return crewMembers.filter((member) =>
    member.role
      .split(", ")
      .some((role) => selectedRoles.includes(role.toUpperCase()))
  );
};

export const sortCrewMembers = (crewMembers: CrewMember[]): CrewMember[] => {
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