import { CrewHeader } from "./crew/CrewHeader";
import { CrewTimeline } from "./crew/CrewTimeline";
import { addDays, subDays } from "date-fns";
import { useCrewManagement } from "@/hooks/useCrewManagement";
import { useState, useEffect } from "react";
import { CrewTableContainer } from "./crew/table/CrewTableContainer";
import { useCrewRoles } from "@/hooks/useCrewRoles";

export function CrewList() {
  const [searchTerm, setSearchTerm] = useState("");
  const { roles, isLoading: isRolesLoading } = useCrewRoles();
  
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

  // Map crew member roles to the latest role data from crew_roles table
  const mappedCrewMembers = filteredCrewMembers.map(crew => ({
    ...crew,
    roles: crew.roles?.map(role => {
      const latestRole = roles?.find(r => r.id === role.id);
      return latestRole || role;
    }) || []
  }));

  const daysToShow = 14;

  const handlePreviousPeriod = () => {
    setStartDate(prev => subDays(prev, daysToShow));
  };

  const handleNextPeriod = () => {
    setStartDate(prev => addDays(prev, daysToShow));
  };

  const [filteredBySearch, setFilteredBySearch] = useState(mappedCrewMembers);

  useEffect(() => {
    const filtered = mappedCrewMembers.filter(crew => {
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
  }, [searchTerm, mappedCrewMembers]);

  if (isLoading || isRolesLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)]">
      <div className="bg-zinc-900 rounded-md flex flex-col h-full">
        <div className="p-4 border-b border-zinc-800/50">
          <CrewHeader 
            selectedCount={selectedItems.length} 
            onAddCrewMember={handleAddCrewMember}
            onEditCrewMember={handleEditCrewMember}
            selectedRoles={selectedRoles}
            allRoles={allRoles}
            onRoleSelect={handleRoleSelect}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedCrew={selectedCrew}
          />
        </div>

        <CrewTableContainer 
          crewMembers={filteredBySearch}
          selectedItems={selectedItems}
          onItemSelect={handleItemSelect}
          roles={roles || []}
        />

        <CrewTimeline 
          startDate={startDate}
          daysToShow={daysToShow}
          selectedCrew={selectedCrew}
          onPreviousPeriod={handlePreviousPeriod}
          onNextPeriod={handleNextPeriod}
        />
      </div>
    </div>
  );
}
