import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CrewMember, CrewRole } from "@/types/crew";

interface CrewMemberSelectProps {
  projectRoleId: string;
  selectedCrewMember: CrewMember | null;
  onSelect: (projectRoleId: string, crewMemberId: string) => void;
  roleName: string;
}

interface CrewMemberResponse {
  id: string;
  name: string;
  roles: CrewRole[];
}

export function CrewMemberSelect({ 
  projectRoleId,
  selectedCrewMember,
  onSelect,
  roleName 
}: CrewMemberSelectProps) {
  const [open, setOpen] = useState(false);

  const { data: crewMembers, isLoading } = useQuery({
    queryKey: ['crew-members', roleName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_members')
        .select('id, name, roles');
      
      if (error) {
        console.error('Error fetching crew members:', error);
        throw error;
      }

      // Ensure data is an array and properly typed
      const validMembers = (Array.isArray(data) ? data : []) as CrewMemberResponse[];
      return validMembers.filter(member => {
        // Ensure roles is an array and properly typed
        const roles = Array.isArray(member.roles) ? member.roles as CrewRole[] : [];
        return roles.some(role => role.name === roleName);
      });
    },
  });

  // Ensure we always have an array to map over
  const filteredMembers = crewMembers || [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {selectedCrewMember ? selectedCrewMember.name : "Select crew member..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search crew member..." />
          <CommandEmpty>No crew member found.</CommandEmpty>
          <CommandGroup>
            {isLoading ? (
              <CommandItem disabled>Loading...</CommandItem>
            ) : (
              filteredMembers.map((crew) => (
                <CommandItem
                  key={crew.id}
                  value={crew.name}
                  onSelect={() => {
                    onSelect(projectRoleId, crew.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedCrewMember?.id === crew.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {crew.name}
                </CommandItem>
              ))
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}