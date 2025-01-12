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
  
  console.log('All folders:', folders);
  console.log('All crew members:', crew);
  
  // Find the Sonic City folder ID - it has the ID "34f3469f-02bd-4ecf-82f9-11a4e88c2d77"
  const sonicCityFolderId = "34f3469f-02bd-4ecf-82f9-11a4e88c2d77";
  
  console.log('Sonic City folder ID:', sonicCityFolderId);
  
  // Filter crew members to only include those from Sonic City folder
  // and exclude the dev@soniccity.no email
  const filteredCrew = crew?.filter(member => {
    console.log('Checking member:', member.name, 'folder_id:', member.folder_id);
    return member.folder_id === sonicCityFolderId && 
           member.email !== 'dev@soniccity.no';
  }) || [];
  
  console.log('Filtered crew members:', filteredCrew);

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