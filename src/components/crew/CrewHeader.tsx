import { Button } from "@/components/ui/button";
import { UserPlus, Users } from "lucide-react";

interface CrewHeaderProps {
  selectedCount: number;
}

export function CrewHeader({ selectedCount }: CrewHeaderProps) {
  return (
    <>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm">
            All departments
          </Button>
          <Button variant="ghost" size="sm">
            All
          </Button>
        </div>
        <Button size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add crew member
        </Button>
      </div>

      {selectedCount > 0 && (
        <div className="p-2 border-b border-zinc-800/50 flex items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">{selectedCount} members selected</span>
            <Button variant="ghost" size="sm" className="gap-2">
              <Users className="h-4 w-4" />
              EDIT
            </Button>
          </div>
        </div>
      )}
    </>
  );
}