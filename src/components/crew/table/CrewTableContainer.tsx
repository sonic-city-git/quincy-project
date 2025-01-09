import { ScrollArea } from "@/components/ui/scroll-area";
import { CrewTable } from "../CrewTable";
import { CrewMember } from "@/types/crew";

interface CrewTableContainerProps {
  crewMembers: CrewMember[];
  selectedItems: string[];
  onItemSelect: (id: string) => void;
}

export function CrewTableContainer({ 
  crewMembers, 
  selectedItems, 
  onItemSelect 
}: CrewTableContainerProps) {
  return (
    <div className="relative">
      <div className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800/50">
        <CrewTable 
          crewMembers={crewMembers}
          selectedItems={selectedItems}
          onItemSelect={onItemSelect}
          headerOnly
        />
      </div>
      <ScrollArea className="h-[calc(100vh-26rem)]">
        <CrewTable 
          crewMembers={crewMembers}
          selectedItems={selectedItems}
          onItemSelect={onItemSelect}
          bodyOnly
        />
      </ScrollArea>
    </div>
  );
}