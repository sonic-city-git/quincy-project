import { ProjectTable } from "./projects/ProjectTable";
import { useProjects } from "@/hooks/useProjects";
import { useState } from "react";
import { ProjectActions } from "./projects/ProjectActions";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Filter } from "lucide-react";

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
      <Card>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <ProjectActions 
                selectedItems={selectedItem ? [selectedItem] : []} 
                onProjectDeleted={() => setSelectedItem(null)}
              />
            </div>
            <ProjectTable 
              projects={projects} 
              selectedItem={selectedItem}
              onItemSelect={handleItemSelect}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}