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
import { CrewMemberSelectProps } from "./types";
import { useCrewMembers } from "./useCrewMembers";

export function CrewMemberSelect({ 
  projectRoleId,
  selectedCrewMember,
  onSelect,
  roleName 
}: CrewMemberSelectProps) {
  const [open, setOpen] = useState(false);
  const { data: crewMembers = [], isLoading } = useCrewMembers(roleName);

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