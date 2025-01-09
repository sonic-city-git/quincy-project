import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProjectFilterButtonProps {
  selectedOwner: string | null;
  onOwnerSelect: (owner: string | null) => void;
}

export function ProjectFilterButton({ 
  selectedOwner,
  onOwnerSelect 
}: ProjectFilterButtonProps) {
  const [sonicCityCrewMembers, setSonicCityCrewMembers] = useState<Array<{ id: string; name: string }>>([]);

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

      // Ensure data is an array and has valid members
      const validMembers = Array.isArray(data) 
        ? data.filter(member => member && member.id && member.name)
        : [];

      console.log('Fetched crew members:', validMembers);
      setSonicCityCrewMembers(validMembers);
    };

    fetchSonicCityCrewMembers();
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={selectedOwner ? "default" : "outline"} 
          size="icon"
        >
          <Filter className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        {sonicCityCrewMembers.map((crew) => (
          <DropdownMenuCheckboxItem
            key={crew.id}
            checked={selectedOwner === crew.name}
            onCheckedChange={(checked) => onOwnerSelect(checked ? crew.name : null)}
          >
            {crew.name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}