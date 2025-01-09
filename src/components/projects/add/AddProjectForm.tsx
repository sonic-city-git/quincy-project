import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomerSelect } from "../customer/CustomerSelect";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AddProjectFormProps {
  onSubmit: (project: {
    name: string;
    customer: string | null;
    color: string;
  }) => void;
}

export function AddProjectForm({ onSubmit }: AddProjectFormProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
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
      customer: selectedCustomer,
      color: '#' + Math.floor(Math.random()*16777215).toString(16), // Random color
    };

    onSubmit(newProject);
  };

  return (
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

      <div className="space-y-2">
        <Label>Customer</Label>
        <CustomerSelect
          projectId=""
          initialCustomer={selectedCustomer || ""}
          onCustomerSelect={(customer) => setSelectedCustomer(customer)}
        />
      </div>

      <Button type="submit" className="mt-4">Create project</Button>
    </form>
  );
}