import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCrew } from "@/hooks/useCrew";
import { useCrewSort } from "@/components/crew/useCrewSort";
import { SONIC_CITY_FOLDER_ID } from "@/constants/organizations";

interface CrewMemberSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function CrewMemberSelect({ value, onChange }: CrewMemberSelectProps) {
  // PERFORMANCE OPTIMIZATION: Use consistent folder ID for crew data
  const { crew } = useCrew(SONIC_CITY_FOLDER_ID);
  const { sortCrew } = useCrewSort();
  const sortedCrew = sortCrew(crew || []);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select preferred crew member" />
      </SelectTrigger>
      <SelectContent>
        {sortedCrew.map((member) => (
          <SelectItem key={member.id} value={member.id}>
            {member.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}