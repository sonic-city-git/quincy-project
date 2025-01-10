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

  // Ensure entities is always an array and contains valid data
  const safeEntities = React.useMemo(() => {
    if (!Array.isArray(entities)) {
      console.warn('EntitySelect: entities prop is not an array', entities);
      return [];
    }
    return entities.filter((entity): entity is Entity => {
      if (!entity || typeof entity !== 'object') {
        console.warn('EntitySelect: invalid entity', entity);
        return false;
      }
      return typeof entity.id === 'string' && typeof entity.name === 'string';
    });
  }, [entities]);

  // Find the selected entity
  const selectedEntity = React.useMemo(() => {
    return safeEntities.find(entity => entity.id === value);
  }, [value, safeEntities]);

  if (isLoading) {
    return (
      <Button
        variant="outline"
        role="combobox"
        className="w-full justify-between bg-zinc-900/50"
        disabled
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="ml-2">Loading...</span>
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
            {safeEntities.map((entity) => (
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