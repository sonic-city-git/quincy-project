import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCrew } from "@/hooks/useCrew";

interface ProjectOwnerFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const SONIC_CITY_FOLDER_ID = "34f3469f-02bd-4ecf-82f9-11a4e88c2d77";

export function ProjectOwnerFilter({ value, onChange }: ProjectOwnerFilterProps) {
  const { crew, loading } = useCrew(SONIC_CITY_FOLDER_ID);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="default"
          className="gap-2 bg-zinc-800/50 border-zinc-700 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Filter className="h-4 w-4" />
          Filter
          {value && (
            <Badge variant="secondary" className="ml-1">
              1
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {crew.map((member) => (
          <DropdownMenuCheckboxItem
            key={member.id}
            checked={value === member.id}
            onCheckedChange={() => onChange(value === member.id ? '' : member.id)}
          >
            {member.name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}