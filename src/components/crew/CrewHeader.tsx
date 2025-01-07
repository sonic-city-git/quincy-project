import { Button } from "@/components/ui/button";
import { AddCrewMemberDialog } from "./AddCrewMemberDialog";

interface CrewHeaderProps {
  selectedCount: number;
}

export function CrewHeader({ selectedCount }: CrewHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm">
          All departments
        </Button>
        <Button variant="ghost" size="sm">
          All
        </Button>
      </div>
      <AddCrewMemberDialog />
    </div>
  );
}