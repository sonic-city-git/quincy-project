import { Button } from "@/components/ui/button";
import { Copy, Trash } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AddProjectDialog } from "./AddProjectDialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface ProjectActionsProps {
  selectedItems?: string[];
  onProjectDeleted?: () => void;
}

export function ProjectActions({ selectedItems = [], onProjectDeleted }: ProjectActionsProps) {
  const hasSelection = selectedItems.length > 0;
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleDelete = async () => {
    try {
      console.log('Deleting project with ID:', selectedItems[0]);
      
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', selectedItems[0]);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      onProjectDeleted?.();
      
      toast({
        title: "Project deleted",
        description: "The project has been deleted successfully",
      });
      
      navigate('/projects');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Failed to delete the project",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      {hasSelection && (
        <>
          <Button variant="secondary" className="gap-2">
            <Copy className="h-4 w-4" />
            Duplicate Project
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash className="h-4 w-4" />
                Delete Project
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the selected project.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
      <div className="ml-auto">
        <Button onClick={() => setIsAddDialogOpen(true)}>Add Project</Button>
        <AddProjectDialog 
          open={isAddDialogOpen} 
          onOpenChange={setIsAddDialogOpen}
        />
      </div>
    </div>
  );
}