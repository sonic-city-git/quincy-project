import { Button } from "@/components/ui/button";
import { Plus, Copy, Trash } from "lucide-react";
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

interface ProjectActionsProps {
  selectedItems?: string[];
}

export function ProjectActions({ selectedItems = [] }: ProjectActionsProps) {
  const hasSelection = selectedItems.length > 0;

  const handleDelete = () => {
    // TODO: Implement delete functionality
    console.log('Deleting projects:', selectedItems);
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
                  This action cannot be undone. This will permanently delete the selected project(s).
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
      <Button variant="secondary" className="gap-2 ml-auto">
        <Plus className="h-4 w-4" />
        New Project
      </Button>
    </div>
  );
}