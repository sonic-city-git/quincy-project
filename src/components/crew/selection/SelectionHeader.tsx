import { EditCrewMemberDialog } from "../EditCrewMemberDialog";
import { CrewMember } from "@/types/crew";

interface SelectionHeaderProps {
  selectedCount: number;
  selectedCrew: CrewMember[];
  onEditCrewMember: (editedMember: CrewMember) => void;
  onDeleteCrewMembers: (ids: string[]) => void;
}

export function SelectionHeader({ 
  selectedCount,
  selectedCrew,
  onEditCrewMember,
  onDeleteCrewMembers
}: SelectionHeaderProps) {
  const handleDelete = () => {
    const selectedIds = selectedCrew.map(crew => crew.id);
    onDeleteCrewMembers(selectedIds);
  };

  return (
    <div className="h-[48px] border-b border-zinc-800/50">
      <div className="flex items-center px-4">
        <div className="flex-1">
          {selectedCount > 0 && (
            <EditCrewMemberDialog 
              selectedCrew={selectedCrew}
              onEditCrewMember={onEditCrewMember}
              onDeleteCrewMember={handleDelete}
            />
          )}
        </div>
      </div>
    </div>
  );
}