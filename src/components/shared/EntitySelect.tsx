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

  // Ensure we're working with a valid array and valid entities
  const safeEntities = React.useMemo(() => {
    if (!entities || !Array.isArray(entities)) return [];
    
    return entities.filter((entity): entity is Entity => 
      entity !== null &&
      typeof entity === 'object' &&
      'id' in entity &&
      typeof entity.id === 'string' &&
      'name' in entity &&
      typeof entity.name === 'string'
    );
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
          <CommandGroup>
            {Array.isArray(safeEntities) && safeEntities.map((entity) => (
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
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}