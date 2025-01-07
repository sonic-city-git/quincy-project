import { ProjectActions } from "./projects/ProjectActions";
import { ProjectTable } from "./projects/ProjectTable";
import { useProjects } from "@/hooks/useProjects";
import { useState } from "react";
import { ProjectFilterButton } from "./projects/filter/ProjectFilterButton";

export function ProjectList() {
  const { projects, loading } = useProjects();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);

  const handleItemSelect = (id: string) => {
    setSelectedItems((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredProjects.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredProjects.map((project) => project.id));
    }
  };

  const filteredProjects = selectedOwner
    ? projects.filter(project => project.owner === selectedOwner)
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
        <ProjectActions selectedItems={selectedItems} />
      </div>
      <ProjectTable 
        projects={filteredProjects} 
        selectedItems={selectedItems}
        onSelectAll={handleSelectAll}
        onItemSelect={handleItemSelect}
      />
    </div>
  );
}