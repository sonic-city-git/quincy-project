import { ProjectActions } from "./projects/ProjectActions";
import { ProjectTable } from "./projects/ProjectTable";
import { useProjects } from "@/hooks/useProjects";
import { useState } from "react";

export function ProjectList() {
  const { projects, loading } = useProjects();
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const handleItemSelect = (id: string) => {
    setSelectedItem(prev => prev === id ? null : id);
  };

  const handleProjectDeleted = () => {
    setSelectedItem(null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <ProjectActions 
          selectedItems={selectedItem ? [selectedItem] : []} 
          onProjectDeleted={handleProjectDeleted}
        />
      </div>
      <ProjectTable 
        projects={projects} 
        selectedItem={selectedItem}
        onItemSelect={handleItemSelect}
      />
    </div>
  );
}