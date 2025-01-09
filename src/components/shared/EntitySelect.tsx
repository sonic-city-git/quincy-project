import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Entity {
  id: string;
  name: string;
}

interface EntitySelectProps {
  entities: Entity[];
  value: string | string[];
  onValueChange: (value: string | string[]) => void;
  placeholder: string;
  isLoading?: boolean;
  required?: boolean;
  multiple?: boolean;
}

export function EntitySelect({ 
  entities, 
  value, 
  onValueChange, 
  placeholder,
  isLoading,
  required,
  multiple = false
}: EntitySelectProps) {
  const handleSelect = (selectedValue: string) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(selectedValue)
        ? currentValues.filter(v => v !== selectedValue)
        : [...currentValues, selectedValue];
      onValueChange(newValues);
    } else {
      onValueChange(selectedValue);
    }
  };

  const getDisplayValue = () => {
    if (Array.isArray(value)) {
      const selectedNames = value
        .map(v => entities.find(e => e.id === v)?.name)
        .filter(Boolean);
      return selectedNames.length > 0 
        ? selectedNames.join(', ') 
        : isLoading ? 'Loading...' : placeholder;
    }
    const selectedEntity = entities.find(e => e.id === value);
    return selectedEntity?.name || (isLoading ? 'Loading...' : placeholder);
  };

  return (
    <Select 
      value={Array.isArray(value) ? value[0] || '' : value} 
      onValueChange={handleSelect}
      required={required}
    >
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder={getDisplayValue()} />
      </SelectTrigger>
      <SelectContent>
        <ScrollArea className="h-[200px]" type="hover">
          <div className="p-1">
            {entities.map((entity) => (
              <SelectItem 
                key={entity.id} 
                value={entity.id}
                className={`cursor-pointer relative flex w-full select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent hover:text-accent-foreground ${
                  Array.isArray(value) && value.includes(entity.id) ? 'bg-accent' : ''
                }`}
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