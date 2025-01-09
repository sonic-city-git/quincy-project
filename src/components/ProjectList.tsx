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

  // Filter projects based on the selected owner's ID
  const filteredProjects = selectedOwner
    ? projects.filter(project => {
        console.log('Filtering project:', {
          projectOwnerId: project.owner_id,
          selectedOwner,
          matches: project.owner_id === selectedOwner
        });
        return project.owner_id === selectedOwner;
      })
    : projects;

  console.log('Projects after filtering:', {
    totalProjects: projects.length,
    filteredProjects: filteredProjects.length,
    selectedOwner
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <ProjectFilterButton 
          selectedOwner={selectedOwner}
          onOwnerSelect={(ownerId) => {
            console.log('Owner selected:', ownerId);
            setSelectedOwner(ownerId);
          }}
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