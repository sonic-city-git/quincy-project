import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Filter } from "lucide-react";

interface ProjectFilterButtonProps {
  selectedOwner: string | null;
  onOwnerSelect: (ownerId: string | null) => void;
}

export function ProjectFilterButton({ selectedOwner, onOwnerSelect }: ProjectFilterButtonProps) {
  const [sonicCityCrewMembers, setSonicCityCrewMembers] = useState<{ id: string; name: string; }[]>([]);

  useEffect(() => {
    const fetchSonicCityCrewMembers = async () => {
      console.log('Fetching Sonic City crew members...');
      const { data, error } = await supabase
        .from('crew_members')
        .select('id, name, crew_folder')
        .eq('crew_folder->>name', 'Sonic City');

      if (error) {
        console.error('Error fetching crew members:', error);
        return;
      }

      // Ensure data is an array and has valid members, then sort alphabetically
      const validMembers = Array.isArray(data) 
        ? data
            .filter(member => member && member.id && member.name)
            .sort((a, b) => a.name.localeCompare(b.name))
        : [];

      console.log('Fetched crew members:', validMembers);
      setSonicCityCrewMembers(validMembers);
    };

    fetchSonicCityCrewMembers();
  }, []);

  const selectedMember = sonicCityCrewMembers.find(member => member.id === selectedOwner);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          {selectedMember ? selectedMember.name : "All owners"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onOwnerSelect(null)}>
          All owners
        </DropdownMenuItem>
        {sonicCityCrewMembers.map((member) => (
          <DropdownMenuItem
            key={member.id}
            onClick={() => onOwnerSelect(member.id)}
          >
            {member.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}