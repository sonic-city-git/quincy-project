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
import { sortCrewMembers } from "@/utils/crewUtils";

interface ProjectFilterButtonProps {
  selectedOwner: string | null;
  onOwnerSelect: (ownerId: string | null) => void;
}

export function ProjectFilterButton({ selectedOwner, onOwnerSelect }: ProjectFilterButtonProps) {
  const [open, setOpen] = useState(false);

  const { data: crewMembers = [], isLoading } = useQuery({
    queryKey: ['crew-members-filter'],
    queryFn: async () => {
      console.log('Fetching crew members for filter');
      const { data, error } = await supabase
        .from('crew_members')
        .select('*');

      if (error) {
        console.error('Error fetching crew members:', error);
        throw error;
      }

      const members = data.map(member => ({
        id: member.id,
        name: member.name,
        crew_folder: member.crew_folder
      }));

      // Sort members with Sonic City first
      return sortCrewMembers(members);
    },
  });

  if (isLoading) {
    return (
      <Button variant="outline" className="w-[200px] justify-between">
        Loading...
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    );
  }

  const selectedMemberName = crewMembers.find(member => member.id === selectedOwner)?.name;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {selectedMemberName || "Select member..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search members..." />
          <CommandEmpty>No member found.</CommandEmpty>
          <CommandGroup>
            {crewMembers.map((member) => (
              <CommandItem
                key={member.id}
                onSelect={() => {
                  onOwnerSelect(selectedOwner === member.id ? null : member.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedOwner === member.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {member.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}