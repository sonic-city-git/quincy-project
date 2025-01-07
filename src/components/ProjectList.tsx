import { ProjectActions } from "./projects/ProjectActions";
import { ProjectTable } from "./projects/ProjectTable";
import { useProjects } from "@/hooks/useProjects";
import { useState } from "react";

export function ProjectList() {
  const { projects, loading } = useProjects();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleItemSelect = (id: string) => {
    setSelectedItems((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.length === projects.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(projects.map((project) => project.id));
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <ProjectActions />
      <ProjectTable 
        projects={projects} 
        selectedItems={selectedItems}
        onSelectAll={handleSelectAll}
        onItemSelect={handleItemSelect}
      />
    </div>
  );
}