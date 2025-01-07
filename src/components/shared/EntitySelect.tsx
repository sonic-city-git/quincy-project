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
      <SelectContent className="overflow-y-auto">
        <ScrollArea className="h-[200px] w-full" type="hover">
          <div className="p-1">
            {entities.map((entity) => (
              <SelectItem 
                key={entity.id} 
                value={entity.id}
                className="cursor-pointer relative flex w-full select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent hover:text-accent-foreground"
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