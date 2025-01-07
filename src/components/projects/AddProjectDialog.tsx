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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newProject = {
      name: formData.get("name") as string,
      owner_id: selectedOwner,
      customer: selectedCustomer,
      color: '#' + Math.floor(Math.random()*16777215).toString(16), // Random color
    };

    onAddProject(newProject);
    setOpen(false);
    toast({
      title: "Project created",
      description: "New project has been created successfully",
    });
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
              placeholder="Taylor Swift"
              required
            />
          </div>
          
          <OwnerSelect
            projectId=""
            initialOwner={selectedOwner}
          />

          <div className="grid gap-2">
            <Label>Customer</Label>
            <CustomerSelect
              projectId=""
              initialCustomer={selectedCustomer || ""}
            />
          </div>

          <Button type="submit" className="mt-4">Create project</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}