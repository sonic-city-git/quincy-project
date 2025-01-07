import { useState } from "react";
import { CrewMember, NewCrewMember } from "@/types/crew";
import { MOCK_CREW } from "@/data/mockCrew";
import { useCrewSelection } from "./useCrewSelection";
import { useCrewRoles } from "./useCrewRoles";
import { getAllUniqueRoles, filterCrewByRoles, sortCrewMembers } from "@/utils/crewUtils";

export function useCrewManagement() {
  const [startDate, setStartDate] = useState(new Date());
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>(MOCK_CREW);
  
  const { selectedItems, handleItemSelect, getSelectedCrew, clearSelection } = useCrewSelection();
  const { selectedRoles, handleRoleSelect } = useCrewRoles();

  const handleAddCrewMember = (newMember: NewCrewMember) => {
    const crewMember: CrewMember = {
      id: (crewMembers.length + 1).toString(),
      name: `${newMember.firstName} ${newMember.lastName}`,
      role: newMember.tags.join(", "),
      email: newMember.email,
      phone: newMember.phone,
      folder: newMember.folder,
    };

    setCrewMembers((prev) => [...prev, crewMember]);
  };

  const handleEditCrewMember = (editedMember: CrewMember) => {
    setCrewMembers((prev) =>
      prev.map((member) =>
        member.id === editedMember.id ? editedMember : member
      )
    );
    clearSelection();
  };

  const handleDeleteCrewMembers = () => {
    setCrewMembers((prev) => 
      prev.filter((member) => !selectedItems.includes(member.id))
    );
    clearSelection();
  };

  const allRoles = getAllUniqueRoles(crewMembers);
  const filteredCrewMembers = sortCrewMembers(filterCrewByRoles(crewMembers, selectedRoles));
  const selectedCrew = getSelectedCrew(filteredCrewMembers);

  return {
    selectedItems,
    startDate,
    setStartDate,
    selectedRoles,
    allRoles,
    filteredCrewMembers,
    selectedCrew,
    handleItemSelect,
    handleAddCrewMember,
    handleEditCrewMember,
    handleDeleteCrewMembers,
    handleRoleSelect,
  };
}