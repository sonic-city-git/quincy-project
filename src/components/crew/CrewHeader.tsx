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
      </div>
      <AddCrewMemberDialog onAddCrewMember={onAddCrewMember} />
    </div>
  );
}