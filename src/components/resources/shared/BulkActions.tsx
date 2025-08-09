import { Button } from "@/components/ui/button";
import { Resource, ResourceType, isCrewResource } from "../types/resource";
import { useCrew } from "@/hooks/crew";
import { useEquipment } from "@/hooks/equipment";
import { Trash2, AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface BulkActionsProps {
  selectedResources: Resource[];
  onActionComplete: () => void;
}

export function BulkActions({ selectedResources, onActionComplete }: BulkActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { deleteMember } = useCrew();
  const { deleteEquipment } = useEquipment();

  if (selectedResources.length === 0) return null;

  const handleDelete = async () => {
    const crewIds = selectedResources
      .filter(isCrewResource)
      .map(resource => resource.id);
    
    const equipmentIds = selectedResources
      .filter(resource => !isCrewResource(resource))
      .map(resource => resource.id);

    // Delete crew members
    await Promise.all(crewIds.map(id => deleteMember(id)));

    // Delete equipment
    await Promise.all(equipmentIds.map(id => deleteEquipment(id)));

    onActionComplete();
    setShowDeleteDialog(false);
  };

  const resourceTypes = new Set(selectedResources.map(r => r.type));
  const isMixedSelection = resourceTypes.size > 1;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">
        {selectedResources.length} selected
      </span>
      
      {/* Delete action */}
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setShowDeleteDialog(true)}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete {selectedResources.length} {isMixedSelection ? 'resources' : selectedResources[0].type.toLowerCase()}
      </Button>

      {/* Type-specific actions can be added here */}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Confirm Deletion
              </div>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedResources.length} {isMixedSelection ? 'resources' : selectedResources[0].type.toLowerCase()}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}