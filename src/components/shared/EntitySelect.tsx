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
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
}

export function EntitySelect({
  entities = [],
  value,
  onValueChange,
  placeholder = "Select...",
  isLoading = false,
}: EntitySelectProps) {
  const selectedEntity = entities.find((entity) => entity.id === value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between"
        >
          {selectedEntity?.name || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Command>
          <CommandInput 
            placeholder={`Search ${placeholder.toLowerCase()}`} 
            className="h-9"
            autoComplete="off"
          />
          <ScrollArea className="h-[200px]">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {(entities || []).map((entity) => (
                <CommandItem
                  key={entity.id}
                  value={entity.id}
                  onSelect={() => onValueChange(entity.id)}
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
            </CommandGroup>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  );
}