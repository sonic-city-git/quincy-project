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
import { useFolders } from "@/hooks/useFolders";
import { useCrewSort } from "@/components/crew/useCrewSort";

interface ProjectOwnerFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function ProjectOwnerFilter({ value, onChange }: ProjectOwnerFilterProps) {
  const { crew, loading } = useCrew();
  const { folders } = useFolders();
  const { sortCrew } = useCrewSort();
  
  // Find Sonic City folder and log for debugging
  const sonicCityFolder = folders?.find(folder => {
    console.log('Checking folder:', folder.name);
    return folder.name.toLowerCase() === 'sonic city'
  });
  
  console.log('Found Sonic City folder:', sonicCityFolder);
  
  // Filter and sort crew members
  const filteredCrew = sortCrew(
    crew.filter(member => {
      const isSonicCity = sonicCityFolder && member.folder_id === sonicCityFolder.id;
      console.log('Checking member:', member.name, 'folder_id:', member.folder_id, 'isSonicCity:', isSonicCity);
      return isSonicCity;
    })
  );

  console.log('Filtered crew members:', filteredCrew);

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
          {value && (
            <Badge variant="secondary" className="ml-1">
              1
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {filteredCrew.map((member) => (
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