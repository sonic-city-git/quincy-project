import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EntitySelect } from "@/components/shared/EntitySelect";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AddProjectDialogProps {
  onAddProject: (projectData: {
    name: string;
    owner_id: string;
    customer_id: string | null;
    color: string;
  }) => Promise<any>;
}

export function AddProjectDialog({ onAddProject }: AddProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  const { data: crewMembers = [], isLoading: isLoadingCrew } = useQuery({
    queryKey: ['crew_members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_members')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onAddProject({
        name: projectName,
        owner_id: selectedOwnerId,
        customer_id: selectedCustomerId || null,
        color: "#000000",
      });
      setOpen(false);
      setProjectName("");
      setSelectedOwnerId("");
      setSelectedCustomerId("");
    } catch (error) {
      console.error("Error adding project:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
          <DialogDescription>
            Create a new project by entering the details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner">Project Owner</Label>
            <EntitySelect
              entities={crewMembers}
              value={selectedOwnerId}
              onValueChange={(value) => setSelectedOwnerId(value as string)}
              placeholder="Project Owner"
              isLoading={isLoadingCrew}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer">Customer</Label>
            <EntitySelect
              entities={customers}
              value={selectedCustomerId}
              onValueChange={(value) => setSelectedCustomerId(value as string)}
              placeholder="Customer"
              isLoading={isLoadingCustomers}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit">Create Project</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}