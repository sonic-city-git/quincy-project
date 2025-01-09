import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CrewMember {
  id: string;
  name: string;
}

interface ProjectFilterButtonProps {
  selectedOwner: string | null;
  onOwnerSelect: (ownerId: string | null) => void;
}

export function ProjectFilterButton({ selectedOwner, onOwnerSelect }: ProjectFilterButtonProps) {
  const [open, setOpen] = useState(false);
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSonicCityCrewMembers = async () => {
    try {
      console.log('Fetching crew members...', { 
        timestamp: new Date().toISOString(),
        currentSelection: selectedOwner 
      });
      setLoading(true);
      const { data, error } = await supabase
        .from('crew_members')
        .select('id, name')
        .filter('crew_folder->name', 'eq', 'Sonic City')
        .order('name');

      if (error) {
        console.error('Error fetching crew members:', error);
        return;
      }

      console.log('Fetched crew members:', {
        count: data?.length,
        members: data?.map(m => ({ 
          id: m.id, 
          name: m.name,
          isCurrentlySelected: m.id === selectedOwner
        })),
        timestamp: new Date().toISOString()
      });
      setCrewMembers(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSonicCityCrewMembers();
  }, []);

  const selectedMemberName = crewMembers.find(member => member.id === selectedOwner)?.name;
  console.log('Current filter state:', { 
    selectedOwner, 
    selectedMemberName,
    availableMembers: crewMembers.map(m => ({ 
      id: m.id, 
      name: m.name,
      isCurrentlySelected: m.id === selectedOwner 
    })),
    timestamp: new Date().toISOString()
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {loading ? (
            "Loading..."
          ) : selectedMemberName || "Select member..."}
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
                  console.log('Member selection event:', { 
                    memberId: member.id, 
                    memberName: member.name,
                    currentlySelected: selectedOwner === member.id,
                    willSelect: selectedOwner !== member.id,
                    willClear: selectedOwner === member.id,
                    timestamp: new Date().toISOString()
                  });
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