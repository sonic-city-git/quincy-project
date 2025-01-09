import { useState } from "react";
import { CrewMember, CrewRole } from "@/types/crew";

export function useCrewMember(crewMember: CrewMember) {
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(
    crewMember.roles?.map(role => role.id) || []
  );

  return {
    selectedRoleIds,
    setSelectedRoleIds,
  };
}