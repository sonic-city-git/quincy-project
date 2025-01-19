import { SelectContent, SelectItem } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CrewMember } from "@/types/crew";
import { useCrewSort } from "@/components/crew/useCrewSort";

interface CrewMemberSelectContentProps {
  crew: CrewMember[];
  onSelect?: (value: string) => void;
  showNoneOption?: boolean;
}

export function CrewMemberSelectContent({ crew = [], onSelect, showNoneOption = false }: CrewMemberSelectContentProps) {
  const { sortCrew } = useCrewSort();
  const sortedCrew = sortCrew(crew || []);

  return (
    <SelectContent>
      <ScrollArea className="h-[200px]">
        <div className="p-1">
          {showNoneOption && (
            <SelectItem 
              value=""
              className="flex items-center gap-3 py-2 px-3 cursor-pointer rounded-sm hover:bg-accent"
              onClick={() => onSelect?.("")}
            >
              <span className="truncate">None</span>
            </SelectItem>
          )}
          {sortedCrew.map((member) => {
            const initials = member.name
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase();

            return (
              <SelectItem 
                key={member.id} 
                value={member.id}
                className="flex items-center gap-3 py-2 px-3 cursor-pointer rounded-sm hover:bg-accent"
                onClick={() => onSelect?.(member.id)}
              >
                <div className="flex items-center gap-3 w-full">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    {member.avatar_url ? (
                      <AvatarImage 
                        src={member.avatar_url} 
                        alt={member.name} 
                        className="object-cover"
                      />
                    ) : (
                      <AvatarFallback className="text-xs bg-zinc-800 text-zinc-400">
                        {initials}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="truncate">{member.name}</span>
                </div>
              </SelectItem>
            );
          })}
        </div>
      </ScrollArea>
    </SelectContent>
  );
}