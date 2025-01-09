import { ProjectActions } from "./projects/ProjectActions";
import { ProjectTable } from "./projects/ProjectTable";
import { useProjects } from "@/hooks/useProjects";
import { useState } from "react";
import { ProjectFilterButton } from "./projects/filter/ProjectFilterButton";

export function ProjectList() {
  const { projects, loading } = useProjects();
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);

  const handleItemSelect = (id: string) => {
    setSelectedItem(prev => prev === id ? null : id);
  };

  const handleProjectDeleted = () => {
    setSelectedItem(null);
  };

  const filteredProjects = selectedOwner
    ? projects.filter(project => project.owner_id === selectedOwner)
    : projects;

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <ProjectFilterButton 
          selectedOwner={selectedOwner}
          onOwnerSelect={setSelectedOwner}
        />
        <ProjectActions 
          selectedItems={selectedItem ? [selectedItem] : []} 
          onProjectDeleted={handleProjectDeleted}
        />
      </div>
      <ProjectTable 
        projects={filteredProjects} 
        selectedItem={selectedItem}
        onItemSelect={handleItemSelect}
      />
    </div>
  );
}