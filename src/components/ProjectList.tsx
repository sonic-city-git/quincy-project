import { ProjectTable } from "./projects/ProjectTable";
import { useProjects } from "@/hooks/useProjects";
import { useState } from "react";
import { ProjectActions } from "./projects/ProjectActions";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Filter, Loader2 } from "lucide-react";

export function ProjectList() {
  const { projects, loading } = useProjects();
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const handleItemSelect = (id: string) => {
    setSelectedItem(prev => prev === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 px-1">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <p className="text-sm text-muted-foreground">
          Manage your active projects and their details
        </p>
      </div>
      
      <Card className="border-0 shadow-md bg-zinc-900/50">
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <ProjectActions 
                selectedItems={selectedItem ? [selectedItem] : []} 
                onProjectDeleted={() => setSelectedItem(null)}
              />
            </div>
            <div className="rounded-lg overflow-hidden border border-zinc-800">
              <ProjectTable 
                projects={projects} 
                selectedItem={selectedItem}
                onItemSelect={handleItemSelect}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}