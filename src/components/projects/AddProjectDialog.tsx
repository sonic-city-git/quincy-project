import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AddProjectForm } from "./add/AddProjectForm";

interface AddProjectDialogProps {
  onAddProject: (project: {
    name: string;
    owner_id: string;
    customer: string | null;
    color: string;
  }) => Promise<any>;
}

export function AddProjectDialog({ onAddProject }: AddProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleCreateProject = async (projectData: {
    name: string;
    owner_id: string;
    customer: string | null;
    color: string;
  }) => {
    try {
      const data = await onAddProject(projectData);
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      setOpen(false);
      toast({
        title: "Success",
        description: "Project created successfully",
      });
      if (data && data[0] && data[0].id) {
        navigate(`/projects/${data[0].id}`);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Project</DialogTitle>
        </DialogHeader>
        <AddProjectForm onSubmit={handleCreateProject} />
      </DialogContent>
    </Dialog>
  );
}