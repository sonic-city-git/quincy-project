import { useState, useEffect } from "react";
import { useCrewSelection } from "./useCrewSelection";
import { useRoleSelection } from "./useRoleSelection";
import { useCrewData } from "./useCrewData";
import { useCrewMutations } from "./useCrewMutations";
import { getAllUniqueRoles, filterCrewByRoles, sortCrewMembers } from "@/utils/crewUtils";

export function useCrewManagement() {
  const [startDate, setStartDate] = useState(new Date());
  const [sortedCrewMembers, setSortedCrewMembers] = useState([]);
  
  const { selectedItems, handleItemSelect, getSelectedCrew, clearSelection } = useCrewSelection();
  const { selectedRoles, handleRoleSelect } = useRoleSelection();
  const { crewMembers, isLoading, fetchCrewMembers } = useCrewData();
  const { handleAddCrewMember, handleEditCrewMember, handleDeleteCrewMembers: deleteCrewMembers } = useCrewMutations(fetchCrewMembers);

  useEffect(() => {
    fetchCrewMembers();
  }, [fetchCrewMembers]);

  useEffect(() => {
    const sortMembers = async () => {
      const filtered = filterCrewByRoles(crewMembers, selectedRoles);
      const sorted = await sortCrewMembers(filtered);
      setSortedCrewMembers(sorted);
    };

    sortMembers();
  }, [crewMembers, selectedRoles]);

  const handleDeleteCrewMembers = async () => {
    await deleteCrewMembers(selectedItems);
    clearSelection();
  };

  const allRoles = getAllUniqueRoles(crewMembers);
  const selectedCrew = getSelectedCrew(sortedCrewMembers);

  return {
    selectedItems,
    startDate,
    setStartDate,
    selectedRoles,
    allRoles,
    filteredCrewMembers: sortedCrewMembers,
    selectedCrew,
    isLoading,
    handleItemSelect,
    handleAddCrewMember,
    handleEditCrewMember,
    handleDeleteCrewMembers,
    handleRoleSelect,
  };
}