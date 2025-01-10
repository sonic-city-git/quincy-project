import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { Loader2 } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { ProjectTable } from "./projects/ProjectTable";
import { ProjectListHeader } from "./projects/ProjectListHeader";

export function ProjectList() {
  const { projects, loading } = useProjects();
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');

  const handleItemSelect = (id: string) => {
    setSelectedItem(prev => prev === id ? null : id);
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.owner && project.owner.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesOwner = !ownerFilter || project.owner_id === ownerFilter;
    
    return matchesSearch && matchesOwner;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 px-6 py-6 max-w-[1600px] mx-auto">
      <Card className="border-0 shadow-md bg-zinc-900/50">
        <CardContent className="p-6">
          <div className="space-y-6">
            <ProjectListHeader
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedItem={selectedItem}
              onProjectDeleted={() => setSelectedItem(null)}
              ownerFilter={ownerFilter}
              onOwnerFilterChange={setOwnerFilter}
            />
            <Separator className="bg-zinc-800" />
            <div className="rounded-lg overflow-hidden border border-zinc-800">
              <ProjectTable 
                projects={filteredProjects} 
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