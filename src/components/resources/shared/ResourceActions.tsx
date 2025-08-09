import { Button } from "@/components/ui/button";
import { useCrew } from "@/hooks/crew";
import { useEquipment } from "@/hooks/equipment";
import { EditMemberDialog } from "@/components/resources/crew/EditMemberDialog";
import { EditEquipmentDialog } from "@/components/resources/equipment/EditEquipmentDialog";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, AlertCircle } from "lucide-react";

interface ResourceActionsProps {
  selectedItemId: string;
}

export function ResourceActions({ selectedItemId }: ResourceActionsProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const { crew, deleteMember } = useCrew();
  const { equipment, deleteEquipment } = useEquipment();

  const crewMember = crew?.find((m) => m.id === selectedItemId);
  const equipmentItem = equipment?.find((e) => e.id === selectedItemId);

  const handleDelete = async () => {
    if (crewMember) {
      await deleteMember(selectedItemId);
    } else if (equipmentItem) {
      await deleteEquipment(selectedItemId);
    }
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowEditDialog(true)}
        >
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>

      {/* Edit Dialogs */}
      {showEditDialog && crewMember && (
        <EditMemberDialog
          member={crewMember}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
        />
      )}
      {showEditDialog && equipmentItem && (
        <EditEquipmentDialog
          item={equipmentItem}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
        />
      )}

      {/* Delete Dialog */}
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
              Are you sure you want to delete this {crewMember ? "crew member" : "equipment"}?
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
    </>
  );
}