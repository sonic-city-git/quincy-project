import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRef } from "react";

interface Entity {
  id: string;
  name: string;
}

interface EntitySelectProps {
  entities: Entity[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  isLoading?: boolean;
  required?: boolean;
}

export function EntitySelect({ 
  entities, 
  value, 
  onValueChange, 
  placeholder,
  isLoading,
  required
}: EntitySelectProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  console.log('EntitySelect received entities:', entities);
  console.log('EntitySelect current value:', value);

  // Custom sort function to prioritize specific names
  const sortedEntities = [...entities].sort((a, b) => {
    const order = ['Sonic City', 'Associate', 'Freelance'];
    const aIndex = order.indexOf(a.name);
    const bIndex = order.indexOf(b.name);
    
    // If both items are in the priority list, sort by their order
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    // If only a is in the priority list, it comes first
    if (aIndex !== -1) return -1;
    // If only b is in the priority list, it comes first
    if (bIndex !== -1) return 1;
    // For all other items, sort alphabetically
    return a.name.localeCompare(b.name);
  });

  console.log('EntitySelect sorted entities:', sortedEntities);

  const getDisplayValue = () => {
    const selectedEntity = entities.find(e => e.id === value);
    return selectedEntity?.name || (isLoading ? 'Loading...' : placeholder);
  };

  return (
    <Select 
      value={value} 
      onValueChange={onValueChange}
      required={required}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={getDisplayValue()} />
      </SelectTrigger>
      <SelectContent 
        ref={scrollRef}
        className="max-h-[300px] overflow-hidden"
        position="popper"
        sideOffset={4}
      >
        <ScrollArea className="h-[var(--radix-select-content-available-height)]">
          <div className="p-1">
            {sortedEntities.map((entity) => (
              <SelectItem 
                key={entity.id} 
                value={entity.id}
                className="cursor-pointer rounded-sm relative"
              >
                {entity.name}
              </SelectItem>
            ))}
          </div>
        </ScrollArea>
      </SelectContent>
    </Select>
  );
}