import * as React from "react";
import { Check } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";

interface Entity {
  id: string;
  name: string;
}

interface EntitySelectProps {
  entities: Entity[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
}

export function EntitySelect({
  entities,
  value,
  onValueChange,
  placeholder = "Select...",
  isLoading = false,
}: EntitySelectProps) {
  const [open, setOpen] = React.useState(false);

  const sortedEntities = React.useMemo(() => {
    return [...entities].sort((a, b) => a.name.localeCompare(b.name));
  }, [entities]);

  const selectedEntity = sortedEntities.find((entity) => entity.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedEntity ? selectedEntity.name : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder={`Search ${placeholder.toLowerCase()}...`}
            className="h-9"
            autoComplete="off"
          />
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup>
            <ScrollArea className="h-[200px] overflow-y-auto">
              {sortedEntities.map((entity) => (
                <CommandItem
                  key={entity.id}
                  value={entity.name}
                  onSelect={() => {
                    onValueChange(entity.id);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  {entity.name}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === entity.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </ScrollArea>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}