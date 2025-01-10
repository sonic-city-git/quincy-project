import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CrewRole } from "@/hooks/useCrewRoles";
import { sortRoles } from "@/utils/roleUtils";

interface CrewRoleFilterProps {
  roles: CrewRole[];
  selectedRoles: string[];
  onRoleToggle: (roleId: string) => void;
}

export function CrewRoleFilter({ roles, selectedRoles, onRoleToggle }: CrewRoleFilterProps) {
  const sortedRoles = sortRoles(roles);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Filter className="h-4 w-4" />
          Filter
          {selectedRoles.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {selectedRoles.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {sortedRoles.map((role) => (
          <DropdownMenuCheckboxItem
            key={role.id}
            checked={selectedRoles.includes(role.id)}
            onCheckedChange={() => onRoleToggle(role.id)}
          >
            {role.name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}