import { CrewHeader } from "./crew/CrewHeader";
import { CrewTimeline } from "./crew/CrewTimeline";
import { addDays, subDays } from "date-fns";
import { useCrewManagement } from "@/hooks/useCrewManagement";
import { useState, useEffect } from "react";
import { SelectionHeader } from "./crew/selection/SelectionHeader";
import { CrewTableContainer } from "./crew/table/CrewTableContainer";

export function CrewList() {
  const [searchTerm, setSearchTerm] = useState("");
  const {
    selectedItems,
    startDate,
    setStartDate,
    selectedRoles,
    allRoles,
    filteredCrewMembers,
    selectedCrew,
    isLoading,
    handleItemSelect,
    handleAddCrewMember,
    handleEditCrewMember,
    handleDeleteCrewMembers,
    handleRoleSelect,
  } = useCrewManagement();

  const daysToShow = 14;

  const handlePreviousPeriod = () => {
    setStartDate(prev => subDays(prev, daysToShow));
  };

  const handleNextPeriod = () => {
    setStartDate(prev => addDays(prev, daysToShow));
  };

  const [filteredBySearch, setFilteredBySearch] = useState(filteredCrewMembers);

  useEffect(() => {
    const filtered = filteredCrewMembers.filter(crew => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      
      const folderName = crew.crew_folder?.name || '';
      
      return (
        crew.name.toLowerCase().includes(searchLower) ||
        crew.email.toLowerCase().includes(searchLower) ||
        crew.phone.toLowerCase().includes(searchLower) ||
        folderName.toLowerCase().includes(searchLower)
      );
    });
    setFilteredBySearch(filtered);
  }, [searchTerm, filteredCrewMembers]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-zinc-900 rounded-md flex flex-col">
        <div className="p-4 border-b border-zinc-800/50">
          <CrewHeader 
            selectedCount={selectedItems.length} 
            onAddCrewMember={handleAddCrewMember}
            selectedRoles={selectedRoles}
            allRoles={allRoles}
            onRoleSelect={handleRoleSelect}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>

        <SelectionHeader 
          selectedCount={selectedItems.length}
          selectedCrew={selectedCrew}
          onEditCrewMember={handleEditCrewMember}
          onDeleteCrewMembers={handleDeleteCrewMembers}
        />

        <CrewTableContainer 
          crewMembers={filteredBySearch}
          selectedItems={selectedItems}
          onItemSelect={handleItemSelect}
        />

        <div className="border-t border-zinc-800/50">
          <CrewTimeline 
            startDate={startDate}
            daysToShow={daysToShow}
            selectedCrew={selectedCrew}
            onPreviousPeriod={handlePreviousPeriod}
            onNextPeriod={handleNextPeriod}
          />
        </div>
      </div>
    </div>
  );
}