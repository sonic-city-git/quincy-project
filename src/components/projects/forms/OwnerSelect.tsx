import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCrew } from "@/hooks/useCrew";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface OwnerSelectProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  className?: string;
}

export function OwnerSelect({ value, onChange, error, required, className }: OwnerSelectProps) {
  // Use the Sonic City folder ID directly
  const sonicCityFolderId = "34f3469f-02bd-4ecf-82f9-11a4e88c2d77";
  const { crew, loading } = useCrew(sonicCityFolderId);
  
  // Filter out the dev@soniccity.no email
  const filteredCrew = crew?.filter(member => member.email !== 'dev@soniccity.no') || [];

  // Find the selected crew member for the trigger display
  const selectedMember = filteredCrew.find(member => member.id === value);
  const selectedInitials = selectedMember?.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-2">
      <Select
        value={value}
        onValueChange={onChange}
        disabled={loading}
        required={required}
      >
        <SelectTrigger 
          className={cn(
            "flex items-center gap-3 px-3 py-2 h-auto min-h-[2.5rem]", 
            error ? "border-red-500" : "", 
            className
          )}
        >
          {selectedMember && (
            <Avatar className="h-8 w-8 flex-shrink-0">
              {selectedMember.avatar_url ? (
                <AvatarImage 
                  src={selectedMember.avatar_url} 
                  alt={selectedMember.name} 
                  className="object-cover"
                />
              ) : (
                <AvatarFallback className="text-xs bg-zinc-800 text-zinc-400">
                  {selectedInitials}
                </AvatarFallback>
              )}
            </Avatar>
          )}
          <SelectValue placeholder="Select owner" className="flex-grow" />
        </SelectTrigger>
        <SelectContent>
          <ScrollArea className="h-[200px] w-full">
            <div className="p-1">
              {filteredCrew.map(member => (
                <SelectItem 
                  key={member.id} 
                  value={member.id}
                  className="cursor-pointer rounded-sm hover:bg-accent py-2 px-3"
                >
                  <span>{member.name}</span>
                </SelectItem>
              ))}
            </div>
          </ScrollArea>
        </SelectContent>
      </Select>
    </div>
  );
}