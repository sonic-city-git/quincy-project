import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCrew } from "@/hooks/useCrew";
import { useFolders } from "@/hooks/useFolders";

interface OwnerSelectProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}

export function OwnerSelect({ value, onChange, error, required }: OwnerSelectProps) {
  const { crew, loading } = useCrew();
  const { folders } = useFolders();
  
  // Find the Sonic City folder
  const sonicCityFolder = folders?.find(folder => folder.name === 'Sonic City');
  
  // Filter crew members to only include those from Sonic City folder
  // and exclude the dev@soniccity.no email
  const filteredCrew = crew?.filter(member => 
    member.folder_id === sonicCityFolder?.id &&
    member.email !== 'dev@soniccity.no'
  ) || [];

  return (
    <div className="space-y-2">
      <Select
        value={value}
        onValueChange={onChange}
        disabled={loading}
        required={required}
      >
        <SelectTrigger className={error ? "border-red-500" : ""}>
          <SelectValue placeholder="Select owner" />
        </SelectTrigger>
        <SelectContent>
          <ScrollArea className="h-[200px] w-full">
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