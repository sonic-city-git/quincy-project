import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { AddCrewMemberDialog } from "./AddCrewMemberDialog";

interface CrewHeaderProps {
  selectedCount: number;
  onAddCrewMember: (newMember: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    folder: string;
    tags: string[];
  }) => void;
}

export function CrewHeader({ selectedCount, onAddCrewMember }: CrewHeaderProps) {
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
      <AddCrewMemberDialog onAddCrewMember={onAddCrewMember} />
    </div>
  );
}