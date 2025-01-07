import { useState } from "react";
import { CrewMember } from "@/types/crew";

export function useCrewSelection() {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleItemSelect = (id: string) => {
    setSelectedItems((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

  const getSelectedCrew = (crewMembers: CrewMember[]) => {
    return crewMembers.filter(crew => selectedItems.includes(crew.id));
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  return {
    selectedItems,
    handleItemSelect,
    getSelectedCrew,
    clearSelection,
  };
}