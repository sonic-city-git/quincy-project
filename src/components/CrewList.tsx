import { CrewHeader } from "./crew/CrewHeader";
import { CrewTimeline } from "./crew/CrewTimeline";
import { CrewTable } from "./crew/CrewTable";
import { addDays, subDays } from "date-fns";
import { EditCrewMemberDialog } from "./crew/EditCrewMemberDialog";
import { useCrewManagement } from "@/hooks/useCrewManagement";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { CrewSearch } from "./crew/search/CrewSearch";

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

  const filteredBySearch = filteredCrewMembers.filter(crew => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      crew.name.toLowerCase().includes(searchLower) ||
      crew.email.toLowerCase().includes(searchLower) ||
      crew.phone.toLowerCase().includes(searchLower) ||
      crew.role?.toLowerCase().includes(searchLower) ||
      crew.folder.toLowerCase().includes(searchLower)
    );
  });

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
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      </div>

      <div className="bg-zinc-900 rounded-md flex flex-col">
        <div className="h-[48px] border-b border-zinc-800/50">
          <div className="h-full flex items-center justify-between px-4">
            <div className={`flex items-center gap-2 transition-opacity duration-200 ${selectedItems.length === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
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

        <div className="relative">
          <div className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800/50">
            <CrewTable 
              crewMembers={[]}
              selectedItems={[]}
              onItemSelect={() => {}}
              headerOnly
            />
          </div>
          <ScrollArea className="h-[calc(100vh-26rem)]">
            <CrewTable 
              crewMembers={filteredBySearch}
              selectedItems={selectedItems}
              onItemSelect={handleItemSelect}
              bodyOnly
            />
          </ScrollArea>
        </div>

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