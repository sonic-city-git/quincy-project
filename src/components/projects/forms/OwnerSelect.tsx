import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCrew } from "@/hooks/useCrew";
import { useFolders } from "@/hooks/useFolders";

interface OwnerSelectProps {
  value?: string;
  onChange: (value: string) => void;
}

export function OwnerSelect({ value, onChange }: OwnerSelectProps) {
  const { crew, loading } = useCrew();
  const { folders } = useFolders();
  
  const sonicCityFolder = folders.find(folder => folder.name === 'Sonic City');
  const filteredCrew = crew.filter(member => member.folder_id === sonicCityFolder?.id);

  return (
    <div className="space-y-2">
      <Select
        value={value}
        onValueChange={onChange}
        disabled={loading}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select owner" />
        </SelectTrigger>
        <SelectContent className="h-[200px]">
          <ScrollArea className="h-full w-full">
            <div className="p-1">
              {filteredCrew.map(member => (
                <SelectItem 
                  key={member.id} 
                  value={member.id}
                  className="cursor-pointer rounded-sm hover:bg-accent"
                >
                  {member.name}
                </SelectItem>
              ))}
            </div>
          </ScrollArea>
        </SelectContent>
      </Select>
    </div>
  );
}