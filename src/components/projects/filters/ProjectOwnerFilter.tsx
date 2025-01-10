import { EntitySelect } from "@/components/shared/EntitySelect";
import { useCrew } from "@/hooks/useCrew";
import { useFolders } from "@/hooks/useFolders";

interface ProjectOwnerFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function ProjectOwnerFilter({ value, onChange }: ProjectOwnerFilterProps) {
  const { crew, loading } = useCrew();
  const { folders } = useFolders();

  // Find Sonic City folder
  const sonicCityFolder = folders.find(folder => folder.name === 'Sonic City');
  
  // Filter crew members to only show those in Sonic City folder
  const filteredCrew = crew.filter(member => member.folder_id === sonicCityFolder?.id);

  const crewOptions = filteredCrew.map(member => ({
    id: member.id,
    name: member.name
  }));

  return (
    <EntitySelect
      entities={crewOptions}
      value={value}
      onValueChange={onChange}
      placeholder="Filter by owner"
      isLoading={loading}
    />
  );
}