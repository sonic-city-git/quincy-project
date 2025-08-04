import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProjects } from "@/hooks/useProjects";
import { useOwnerOptions } from "@/hooks/useOwnerOptions";
import { getInitials } from "@/utils/stringUtils";

interface ProjectOwnerFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function ProjectOwnerFilter({ value, onChange }: ProjectOwnerFilterProps) {
  // PERFORMANCE OPTIMIZATION: Use consolidated useOwnerOptions instead of manual crew processing
  const { projects } = useProjects();
  const ownerOptions = useOwnerOptions(projects, { 
    keyBy: 'name', 
    includeAvatars: true 
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="default"
          className="gap-2 bg-muted/50 border-border text-muted-foreground hover:text-foreground transition-colors"
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
        {ownerOptions.map((owner) => (
          <DropdownMenuCheckboxItem
            key={owner.name}
            checked={value === owner.name}
            onCheckedChange={() => onChange(value === owner.name ? '' : owner.name)}
            className="flex items-center gap-2"
          >
            <Avatar className="h-6 w-6 flex-shrink-0">
              {owner.avatar_url ? (
                <AvatarImage 
                  src={owner.avatar_url} 
                  alt={owner.name} 
                  className="object-cover"
                />
              ) : (
                <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                  {getInitials(owner.name)}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="truncate">{owner.name}</span>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}