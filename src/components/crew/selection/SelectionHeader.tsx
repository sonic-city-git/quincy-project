import { EditCrewMemberDialog } from "../EditCrewMemberDialog";

interface SelectionHeaderProps {
  selectedCount: number;
  selectedCrew: any[];
  onEditCrewMember: (member: any) => void;
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
        <div className={`flex items-center gap-2 transition-opacity duration-200 ${selectedCount === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <span className="text-sm text-zinc-400">{selectedCount} items selected</span>
          {selectedCount === 1 && (
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