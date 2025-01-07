import { Button } from "@/components/ui/button";
import { ProjectList } from "@/components/ProjectList";
import { Plus } from "lucide-react";

const Index = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage your ongoing rental projects
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>
      
      <ProjectList />
    </div>
  );
};

export default Index;