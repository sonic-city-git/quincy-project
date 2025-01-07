import { useState } from "react";
import { CrewMember } from "@/types/crew";

export function useCrewMember(initialMember: CrewMember) {
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialMember.role.split(", ").map((tag) => tag.toLowerCase())
  );

  return {
    selectedTags,
    setSelectedTags,
  };
}