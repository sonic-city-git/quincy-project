import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  console.log('EntitySelect received entities:', entities);
  console.log('EntitySelect current value:', value);

  const getDisplayValue = () => {
    const selectedEntity = entities.find(e => e.id === value);
    return selectedEntity?.name || (isLoading ? 'Loading...' : placeholder);
  };

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

  return (
    <Select 
      value={value} 
      onValueChange={onValueChange}
      required={required}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={getDisplayValue()} />
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        <ScrollArea className="h-full max-h-[300px]" type="auto">
          {sortedEntities.map((entity) => (
            <SelectItem 
              key={entity.id} 
              value={entity.id}
              className="cursor-pointer relative flex w-full select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent hover:text-accent-foreground"
            >
              {entity.name}
            </SelectItem>
          ))}
        </ScrollArea>
      </SelectContent>
    </Select>
  );
}