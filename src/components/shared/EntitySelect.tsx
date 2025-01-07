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
}

export function EntitySelect({ 
  entities, 
  value, 
  onValueChange, 
  placeholder,
  isLoading 
}: EntitySelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={isLoading ? `Loading ${placeholder}...` : `Select ${placeholder}`} />
      </SelectTrigger>
      <SelectContent>
        <ScrollArea className="h-[200px]">
          {entities.map((entity) => (
            <SelectItem 
              key={entity.id} 
              value={entity.id}
            >
              {entity.name}
            </SelectItem>
          ))}
        </ScrollArea>
      </SelectContent>
    </Select>
  );
}