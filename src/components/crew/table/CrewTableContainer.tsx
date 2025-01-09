import { ScrollArea } from "@/components/ui/scroll-area";
import { CrewTable } from "../CrewTable";
import { CrewMember, CrewRole } from "@/types/crew";

interface CrewTableContainerProps {
  crewMembers: CrewMember[];
  selectedItems: string[];
  onItemSelect: (id: string) => void;
  roles: CrewRole[];
}

export function CrewTableContainer({ 
  crewMembers, 
  selectedItems, 
  onItemSelect,
  roles
}: CrewTableContainerProps) {
  return (
    <div className="relative flex-1 min-h-0">
      <div className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800/50">
        <CrewTable 
          crewMembers={crewMembers}
          selectedItems={selectedItems}
          onItemSelect={onItemSelect}
          headerOnly
          roles={roles}
        />
      </div>
      <ScrollArea className="h-[300px]">
        <CrewTable 
          crewMembers={crewMembers}
          selectedItems={selectedItems}
          onItemSelect={onItemSelect}
          bodyOnly
          roles={roles}
        />
      </ScrollArea>
    </div>
  );
}