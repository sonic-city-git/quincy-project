import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
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

interface Entity {
  id: string;
  name: string;
  [key: string]: any;
}

interface EntitySelectProps {
  entities: Entity[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
}

export function EntitySelect({ 
  entities = [], 
  value = "", 
  onValueChange,
  placeholder = "Select...",
  isLoading = false
}: EntitySelectProps) {
  const [open, setOpen] = React.useState(false);

  // Initialize safeEntities with an empty array if entities is undefined
  const safeEntities = React.useMemo(() => {
    if (!Array.isArray(entities)) {
      console.warn('EntitySelect: entities prop is not an array', entities);
      return [];
    }
    
    const filtered = entities.filter((entity): entity is Entity => {
      if (!entity || typeof entity !== 'object') {
        console.warn('EntitySelect: invalid entity', entity);
        return false;
      }
      
      const hasValidId = 'id' in entity && typeof entity.id === 'string';
      const hasValidName = 'name' in entity && typeof entity.name === 'string';
      
      if (!hasValidId || !hasValidName) {
        console.warn('EntitySelect: entity missing required properties', entity);
        return false;
      }
      
      return true;
    });

    return filtered;
  }, [entities]);

  // Find the selected entity safely
  const selectedEntity = React.useMemo(() => {
    if (!value) return undefined;
    return safeEntities.find(entity => entity.id === value);
  }, [value, safeEntities]);

  if (isLoading) {
    return (
      <Button
        variant="outline"
        className="w-full justify-between bg-zinc-900/50"
        disabled
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading...</span>
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
          className="w-full justify-between bg-zinc-900/50"
        >
          {selectedEntity ? (
            selectedEntity.name
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-zinc-900/90">
        <Command>
          <CommandInput 
            placeholder={`Search ${placeholder.toLowerCase()}...`}
            className="h-9"
          />
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup className="max-h-[200px] overflow-auto">
            {safeEntities.length > 0 ? safeEntities.map((entity) => (
              <CommandItem
                key={entity.id}
                value={entity.id}
                onSelect={(currentValue) => {
                  onValueChange(currentValue === value ? "" : currentValue);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === entity.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {entity.name}
              </CommandItem>
            )) : (
              <CommandItem disabled>No options available</CommandItem>
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}