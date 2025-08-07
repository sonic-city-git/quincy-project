import { SelectContent, SelectItem } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CrewMember } from "@/types/crew";
import { useCrewSort } from "@/components/resources/crew/useCrewSort";
import { sortCrewFolderNames } from "@/utils/crewFolderSort";

interface CrewMemberSelectContentProps {
  crew: CrewMember[];
  onSelect?: (value: string) => void;
  showNoneOption?: boolean;
}

export function CrewMemberSelectContent({ crew = [], onSelect, showNoneOption = false }: CrewMemberSelectContentProps) {
  const { sortCrew } = useCrewSort();
  const sortedCrew = sortCrew(crew || []);

  // Group crew by folder (crew is already sorted by folder via useCrewSort)
  const crewByFolder = sortedCrew.reduce((acc, member) => {
    const folderName = member.folderName || 'Unassigned';
    if (!acc[folderName]) {
      acc[folderName] = [];
    }
    acc[folderName].push(member);
    return acc;
  }, {} as Record<string, CrewMember[]>);

  // Sort folder names using global crew folder order
  const sortedFolderNames = sortCrewFolderNames(Object.keys(crewByFolder));

  const renderCrewMember = (member: CrewMember) => {
    const initials = member.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();

    return (
      <SelectItem 
        key={member.id} 
        value={member.id}
        className="flex items-center gap-3 py-1.5 px-3 cursor-pointer rounded-sm hover:bg-muted ml-2"
        onClick={() => onSelect?.(member.id)}
      >
        <div className="flex items-center gap-3 w-full">
          <Avatar className="h-6 w-6 flex-shrink-0">
            {member.avatar_url ? (
              <AvatarImage 
                src={member.avatar_url} 
                alt={member.name} 
                className="object-cover"
              />
            ) : (
              <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                {initials}
              </AvatarFallback>
            )}
          </Avatar>
          <span className="truncate text-sm">{member.name}</span>
        </div>
      </SelectItem>
    );
  };

  return (
    <SelectContent>
      <ScrollArea className="h-[300px]">
        <div className="p-1">
          {showNoneOption && (
            <SelectItem 
              value="_none"
              className="flex items-center gap-3 py-2 px-3 cursor-pointer rounded-sm hover:bg-muted"
              onClick={() => onSelect?.("")}
            >
              <span className="truncate">None</span>
            </SelectItem>
          )}
          
          {sortedFolderNames.map((folderName) => (
            <div key={folderName}>
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/30">
                {folderName}
              </div>
              {crewByFolder[folderName].map(renderCrewMember)}
            </div>
          ))}
        </div>
      </ScrollArea>
    </SelectContent>
  );
}