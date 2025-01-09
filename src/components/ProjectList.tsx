import { ProjectTable } from "./projects/ProjectTable";
import { useProjects } from "@/hooks/useProjects";
import { useState } from "react";

export function ProjectList() {
  const { projects, loading } = useProjects();
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const handleItemSelect = (id: string) => {
    setSelectedItem(prev => prev === id ? null : id);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <ProjectTable 
        projects={projects} 
        selectedItem={selectedItem}
        onItemSelect={handleItemSelect}
      />
    </div>
  );
}