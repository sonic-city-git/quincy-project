import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCrew } from "@/hooks/useCrew";
import { useCrewSort } from "@/components/crew/useCrewSort";

interface CrewMemberSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function CrewMemberSelect({ value, onChange }: CrewMemberSelectProps) {
  const { crew } = useCrew();
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