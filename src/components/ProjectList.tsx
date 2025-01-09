import { ProjectTable } from "./projects/ProjectTable";
import { useProjects } from "@/hooks/useProjects";
import { useState } from "react";
import { ProjectActions } from "./projects/ProjectActions";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Filter, Loader2, Plus } from "lucide-react";
import { Separator } from "./ui/separator";

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
    <div className="space-y-8 px-6 py-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Manage your active projects and their details
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Project
        </Button>
      </div>
      
      <Card className="border-0 shadow-md bg-zinc-900/50">
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </div>
              <ProjectActions 
                selectedItems={selectedItem ? [selectedItem] : []} 
                onProjectDeleted={() => setSelectedItem(null)}
              />
            </div>
            <Separator className="bg-zinc-800" />
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