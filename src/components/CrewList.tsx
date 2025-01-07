import { CrewHeader } from "./crew/CrewHeader";
import { CrewTimeline } from "./crew/CrewTimeline";
import { CrewTable } from "./crew/CrewTable";
import { addDays, subDays } from "date-fns";
import { EditCrewMemberDialog } from "./crew/EditCrewMemberDialog";
import { useCrewManagement } from "@/hooks/useCrewManagement";

export function CrewList() {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <CrewHeader 
          selectedCount={selectedItems.length} 
          onAddCrewMember={handleAddCrewMember}
          selectedRoles={selectedRoles}
          allRoles={allRoles}
          onRoleSelect={handleRoleSelect}
        />
      </div>

      <div className="bg-zinc-900 rounded-md">
        <div className="h-[48px] border-b border-zinc-800/50">
          <div className={`h-full flex items-center justify-between px-2 transition-opacity duration-200 ${selectedItems.length === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400">{selectedItems.length} items selected</span>
              {selectedItems.length === 1 && (
                <EditCrewMemberDialog 
                  selectedCrew={selectedCrew}
                  onEditCrewMember={handleEditCrewMember}
                  onDeleteCrewMember={handleDeleteCrewMembers}
                />
              )}
            </div>
          </div>
        </div>

        <CrewTable 
          crewMembers={filteredCrewMembers}
          selectedItems={selectedItems}
          onItemSelect={handleItemSelect}
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