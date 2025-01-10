import * as React from "react";
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

  // Ensure entities is always an array
  const safeEntities = Array.isArray(entities) ? entities : [];
  
  // Find the selected entity safely
  const selectedEntity = safeEntities.find((entity) => entity.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={isLoading}
        >
          {isLoading ? (
            "Loading..."
          ) : value && selectedEntity ? (
            selectedEntity.name
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup>
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