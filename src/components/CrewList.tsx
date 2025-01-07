import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CrewHeader } from "./crew/CrewHeader";
import { CrewTimeline } from "./crew/CrewTimeline";
import { CrewTable } from "./crew/CrewTable";
import { addDays, subDays } from "date-fns";
import { MOCK_CREW } from "@/data/mockCrew";
import { CrewMember, NewCrewMember } from "@/types/crew";
import { EditCrewMemberDialog } from "./crew/EditCrewMemberDialog";

export function CrewList() {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(new Date());
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>(MOCK_CREW);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const daysToShow = 14;

  const handleItemSelect = (id: string) => {
    setSelectedItems((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

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
    setSelectedItems([]);
  };

  const handleDeleteCrewMembers = () => {
    setCrewMembers((prev) => 
      prev.filter((member) => !selectedItems.includes(member.id))
    );
    setSelectedItems([]);
  };

  const handlePreviousPeriod = () => {
    setStartDate(prev => subDays(prev, daysToShow));
  };

  const handleNextPeriod = () => {
    setStartDate(prev => addDays(prev, daysToShow));
  };

  // Get all unique roles from crew members
  const allRoles = Array.from(
    new Set(
      crewMembers.flatMap((member) =>
        member.role.split(", ").map((role) => role.toUpperCase())
      )
    )
  ).sort();

  const handleRoleSelect = (role: string, checked: boolean) => {
    setSelectedRoles((prev) =>
      checked
        ? [...prev, role]
        : prev.filter((r) => r !== role)
    );
  };

  // Filter crew members based on selected roles
  const filteredCrewMembers = crewMembers.filter((member) => {
    if (selectedRoles.length === 0) return true;
    return member.role
      .split(", ")
      .some((role) => selectedRoles.includes(role.toUpperCase()));
  });

  const selectedCrew = filteredCrewMembers.filter(crew => selectedItems.includes(crew.id));

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
