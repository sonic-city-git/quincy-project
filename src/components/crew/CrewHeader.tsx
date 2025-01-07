import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { AddCrewMemberDialog } from "./AddCrewMemberDialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  selectedRoles: string[];
  allRoles: string[];
  onRoleSelect: (role: string, checked: boolean) => void;
}

export function CrewHeader({ 
  selectedCount, 
  onAddCrewMember, 
  selectedRoles,
  allRoles,
  onRoleSelect 
}: CrewHeaderProps) {
  return (
    <div className="flex justify-between items-center w-full">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={selectedRoles.length > 0 ? "default" : "outline"} 
            size="icon"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[200px]">
          {allRoles.map((role) => (
            <DropdownMenuCheckboxItem
              key={role}
              checked={selectedRoles.includes(role)}
              onCheckedChange={(checked) => onRoleSelect(role, checked)}
            >
              {role}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <AddCrewMemberDialog onAddCrewMember={onAddCrewMember} />
    </div>
  );
}