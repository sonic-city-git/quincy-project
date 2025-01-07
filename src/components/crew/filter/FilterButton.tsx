import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FilterButtonProps {
  selectedRoles: string[];
  allRoles: string[];
  onRoleSelect: (role: string, checked: boolean) => void;
}

export function FilterButton({ 
  selectedRoles, 
  allRoles, 
  onRoleSelect 
}: FilterButtonProps) {
  return (
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
  );
}