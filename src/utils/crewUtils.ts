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

export const sortCrewMembers = (crewMembers: CrewMember[]) => {
  return [...crewMembers].sort((a, b) => {
    // We'll sort by name since folder is now an ID
    return a.name.localeCompare(b.name);
  });
};