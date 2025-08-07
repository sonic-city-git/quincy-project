import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCrew } from "@/hooks/useCrew";
import { useCrewSort } from "@/components/resources/crew/useCrewSort";
import { SONIC_CITY_FOLDER_ID } from "@/constants/organizations";
import { FORM_PATTERNS, cn } from "@/design-system";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMemo } from "react";

interface CrewMemberSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  'aria-label'?: string;
}

export function CrewMemberSelect({ 
  value, 
  onChange, 
  placeholder = "Select preferred crew member",
  className,
  'aria-label': ariaLabel 
}: CrewMemberSelectProps) {
  const { crew } = useCrew();
  const { sortCrew } = useCrewSort();
  
  // Memoize sorted crew for performance
  const sortedCrew = useMemo(() => sortCrew(crew || []), [crew, sortCrew]);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger 
        className={cn(FORM_PATTERNS.dropdown.trigger, className)}
        aria-label={ariaLabel}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={FORM_PATTERNS.dropdown.content}>
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
              className={cn(FORM_PATTERNS.dropdown.item, "flex items-center gap-3 py-2")}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-6 w-6">
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
                <span className="truncate">{member.name}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}