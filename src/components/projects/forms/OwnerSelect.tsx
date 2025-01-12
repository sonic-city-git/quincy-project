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

  return (
    <div className="space-y-2">
      <Select
        value={value}
        onValueChange={onChange}
        disabled={loading}
        required={required}
      >
        <SelectTrigger className={cn(error ? "border-red-500" : "", className)}>
          <SelectValue placeholder="Select owner" />
        </SelectTrigger>
        <SelectContent>
          <ScrollArea className="h-[200px] w-full">
            <div className="p-1">
              {filteredCrew.map(member => {
                const initials = member.name
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase();

                return (
                  <SelectItem 
                    key={member.id} 
                    value={member.id}
                    className="cursor-pointer rounded-sm hover:bg-accent flex items-center gap-2 py-2"
                  >
                    <Avatar className="h-6 w-6">
                      {member.email && (
                        <AvatarImage 
                          src={`https://www.gravatar.com/avatar/${Buffer.from(member.email).toString('hex')}?d=404`}
                          alt={member.name}
                        />
                      )}
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    {member.name}
                  </SelectItem>
                );
              })}
            </div>
          </ScrollArea>
        </SelectContent>
      </Select>
    </div>
  );
}