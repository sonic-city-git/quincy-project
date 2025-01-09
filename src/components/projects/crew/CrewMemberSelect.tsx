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

export function CrewMemberSelect({ 
  projectRoleId,
  selectedCrewMember,
  onSelect,
  roleName 
}: CrewMemberSelectProps) {
  const [open, setOpen] = useState(false);

  const { data: crewMembers = [], isLoading, error } = useQuery({
    queryKey: ['crew-members', roleName],
    queryFn: async () => {
      console.log('Fetching crew members for role:', roleName);
      
      const { data, error } = await supabase
        .from('crew_members')
        .select('id, name, email, phone, roles, crew_folder, created_at');
      
      if (error) {
        console.error('Error fetching crew members:', error);
        throw error;
      }

      if (!data) {
        console.log('No crew members found');
        return [];
      }

      console.log('Raw crew members data:', data);

      // Transform and validate the data
      const validMembers = data.map(member => ({
        id: member.id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        created_at: member.created_at,
        roles: Array.isArray(member.roles) 
          ? member.roles.map((role: any) => ({
              id: role.id || '',
              name: role.name || '',
              color: role.color || '',
              created_at: role.created_at || new Date().toISOString()
            }))
          : [],
        crew_folder: member.crew_folder ? {
          id: typeof member.crew_folder === 'object' ? (member.crew_folder as any).id || '' : '',
          name: typeof member.crew_folder === 'object' ? (member.crew_folder as any).name || '' : '',
          created_at: typeof member.crew_folder === 'object' ? (member.crew_folder as any).created_at || new Date().toISOString() : new Date().toISOString()
        } : null
      })) as CrewMember[];

      console.log('Processed crew members:', validMembers);

      // Filter members by role
      const filteredMembers = validMembers.filter(member => 
        member.roles?.some(role => role.name === roleName)
      );

      console.log('Filtered crew members by role:', filteredMembers);
      return filteredMembers;
    },
    initialData: [], // Ensure we always have an array to work with
  });

  if (error) {
    console.error('Error in CrewMemberSelect:', error);
    return (
      <Button variant="outline" className="w-[200px] justify-between" disabled>
        Error loading crew members
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
          disabled={isLoading}
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
            ) : crewMembers.length === 0 ? (
              <CommandItem disabled>No crew members available</CommandItem>
            ) : (
              crewMembers.map((crew) => (
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