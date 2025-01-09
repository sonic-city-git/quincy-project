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
import { Json } from "@/integrations/supabase/types";

interface CrewMemberSelectProps {
  projectRoleId: string;
  selectedCrewMember: CrewMember | null;
  onSelect: (projectRoleId: string, crewMemberId: string) => void;
  roleName: string;
}

// Type guard for crew role JSON data
const isValidRole = (value: unknown): value is CrewRole => {
  if (!value || typeof value !== 'object') return false;
  
  const role = value as Record<string, unknown>;
  return (
    typeof role.id === 'string' &&
    typeof role.name === 'string' &&
    (role.color === null || typeof role.color === 'string')
  );
};

// Type guard for crew folder JSON data
const isValidCrewFolder = (value: unknown): value is { id: string; name: string; created_at: string } => {
  if (!value || typeof value !== 'object') return false;
  
  const folder = value as Record<string, unknown>;
  return (
    typeof folder.id === 'string' &&
    typeof folder.name === 'string' &&
    typeof folder.created_at === 'string'
  );
};

const getFolderPriority = (folderName: string | null) => {
  if (!folderName) return 4;
  const name = folderName.toLowerCase();
  if (name === 'sonic city') return 1;
  if (name === 'associates') return 2;
  if (name === 'freelance') return 3;
  return 4;
};

export function CrewMemberSelect({ 
  projectRoleId,
  selectedCrewMember,
  onSelect,
  roleName 
}: CrewMemberSelectProps) {
  const [open, setOpen] = useState(false);

  const { data: crewMembers = [], isLoading } = useQuery({
    queryKey: ['crew-members', roleName],
    queryFn: async () => {
      console.log('Fetching crew members for role:', roleName);
      
      const { data, error } = await supabase
        .from('crew_members')
        .select('*');
      
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
      const validMembers = data.map(member => {
        // Parse and validate roles
        const validRoles: CrewRole[] = [];
        if (Array.isArray(member.roles)) {
          member.roles.forEach((role: unknown) => {
            if (isValidRole(role)) {
              validRoles.push(role);
            }
          });
        }

        // Validate and transform crew_folder
        const crewFolder = member.crew_folder && isValidCrewFolder(member.crew_folder)
          ? {
              id: member.crew_folder.id,
              name: member.crew_folder.name,
              created_at: member.crew_folder.created_at
            }
          : null;

        return {
          id: member.id,
          name: member.name,
          email: member.email,
          phone: member.phone,
          created_at: member.created_at,
          roles: validRoles,
          crew_folder: crewFolder
        } satisfies CrewMember;
      });

      console.log('Processed crew members:', validMembers);

      // Filter members by role
      const filteredMembers = validMembers.filter(member => 
        member.roles?.some(role => role.name === roleName)
      );

      // Sort members by folder priority (Sonic City first)
      const sortedMembers = filteredMembers.sort((a, b) => {
        const aPriority = getFolderPriority(a.crew_folder?.name);
        const bPriority = getFolderPriority(b.crew_folder?.name);
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        // If same priority, sort alphabetically by name
        return a.name.localeCompare(b.name);
      });

      console.log('Filtered and sorted crew members:', sortedMembers);
      return sortedMembers;
    },
  });

  if (isLoading) {
    return (
      <Button variant="outline" className="w-[200px] justify-between" disabled>
        Loading...
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
          className="w-[200px] justify-between truncate"
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
            {crewMembers.length === 0 ? (
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
                  className="truncate"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 flex-shrink-0",
                      selectedCrewMember?.id === crew.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{crew.name}</span>
                </CommandItem>
              ))
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}