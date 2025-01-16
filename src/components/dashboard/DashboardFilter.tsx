import { ProjectOwnerFilter } from "../projects/filters/ProjectOwnerFilter";

interface DashboardFilterProps {
  ownerId: string;
  onOwnerChange: (value: string) => void;
}

export function DashboardFilter({ ownerId, onOwnerChange }: DashboardFilterProps) {
  return (
    <div className="mb-6">
      <ProjectOwnerFilter 
        value={ownerId} 
        onChange={onOwnerChange}
      />
    </div>
  );
}