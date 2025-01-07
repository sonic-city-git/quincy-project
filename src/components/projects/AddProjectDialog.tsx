import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { OwnerSelect } from "./owner/OwnerSelect";
import { CustomerSelect } from "./customer/CustomerSelect";
import { useQueryClient } from "@tanstack/react-query";

interface AddProjectDialogProps {
  onAddProject: (project: {
    name: string;
    owner_id: string;
    customer: string | null;
    color: string;
  }) => void;
}

export function AddProjectDialog({ onAddProject }: AddProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedOwner) {
      toast({
        title: "Error",
        description: "Please select a project owner",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData(e.currentTarget);
    const projectName = formData.get("name") as string;

    if (!projectName.trim()) {
      toast({
        title: "Error",
        description: "Project name is required",
        variant: "destructive",
      });
      return;
    }
    
    const newProject = {
      name: projectName,
      owner_id: selectedOwner,
      customer: selectedCustomer,
      color: '#' + Math.floor(Math.random()*16777215).toString(16), // Random color
    };

    try {
      await onAddProject(newProject);
      // Invalidate and refetch projects query
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      setOpen(false);
      toast({
        title: "Success",
        description: "Project created successfully",
      });
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
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Enter project name"
              required
            />
          </div>
          
          <OwnerSelect
            projectId=""
            initialOwner={selectedOwner}
            onOwnerSelect={(ownerId) => setSelectedOwner(ownerId)}
          />

          <CustomerSelect
            projectId=""
            initialCustomer={selectedCustomer || ""}
            onCustomerSelect={(customer) => setSelectedCustomer(customer)}
          />

          <Button type="submit" className="mt-4">Create project</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}