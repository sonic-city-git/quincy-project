import { ProjectTable } from "./projects/ProjectTable";
import { useProjects } from "@/hooks/useProjects";
import { useState } from "react";
import { ProjectActions } from "./projects/ProjectActions";
import { Card, CardContent } from "./ui/card";
import { Filter, Loader2 } from "lucide-react";
import { Separator } from "./ui/separator";
import { ProjectCard } from "./ProjectCard";
import { ViewToggle } from "./projects/ViewToggle";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export function ProjectList() {
  const { projects, loading } = useProjects();
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');

  const handleItemSelect = (id: string) => {
    setSelectedItem(prev => prev === id ? null : id);
  };

  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.owner.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 px-6 py-6 max-w-[1400px] mx-auto">
      <Card className="border-0 shadow-md bg-zinc-900/50">
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm bg-zinc-800/50"
                />
              </div>
              <ViewToggle currentView={viewMode} onViewChange={setViewMode} />
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
            <Separator className="bg-zinc-800" />
            
            {viewMode === 'list' ? (
              <div className="rounded-lg overflow-hidden border border-zinc-800">
                <ProjectTable 
                  projects={filteredProjects} 
                  selectedItem={selectedItem}
                  onItemSelect={handleItemSelect}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    title={project.name}
                    customer={project.owner}
                    equipmentCount={0}
                    staffCount={0}
                    nextBooking={project.lastInvoiced}
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}