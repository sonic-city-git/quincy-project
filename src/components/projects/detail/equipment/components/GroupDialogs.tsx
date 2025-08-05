import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { FORM_PATTERNS, cn } from "@/design-system";

// Proper type definition for equipment group
interface EquipmentGroupData {
  id: string;
  name: string;
  total_price?: number;
}

interface GroupDialogsProps {
  groups: EquipmentGroupData[];
  showDeleteDialog: boolean;
  showNewGroupDialog: boolean;
  groupToDelete: string | null;
  targetGroupId: string;
  newGroupName: string;
  onDeleteDialogClose: () => void;
  onNewGroupDialogClose: () => void;
  onTargetGroupSelect: (id: string) => void;
  onNewGroupNameChange: (name: string) => void;
  onConfirmDelete: () => void;
  onConfirmCreate: () => void;
}

export function GroupDialogs({
  groups,
  showDeleteDialog,
  showNewGroupDialog,
  groupToDelete,
  targetGroupId,
  newGroupName,
  onDeleteDialogClose,
  onNewGroupDialogClose,
  onTargetGroupSelect,
  onNewGroupNameChange,
  onConfirmDelete,
  onConfirmCreate
}: GroupDialogsProps) {
  return (
    <>
      <AlertDialog 
        open={showDeleteDialog} 
        onOpenChange={onDeleteDialogClose}
      >
        <AlertDialogContent className={FORM_PATTERNS.dialog.container}>
          <AlertDialogHeader className={FORM_PATTERNS.dialog.header}>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription>
              This group contains equipment. Would you like to move the equipment to another group or delete it?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className={FORM_PATTERNS.field.group}>
            <Select value={targetGroupId} onValueChange={onTargetGroupSelect}>
              <SelectTrigger className={FORM_PATTERNS.dropdown.trigger}>
                <SelectValue placeholder="Select a target group (or leave empty to delete equipment)" />
              </SelectTrigger>
              <SelectContent className={FORM_PATTERNS.dropdown.content}>
                {groups
                  .filter(g => g.id !== groupToDelete)
                  .map(group => (
                    <SelectItem 
                      key={group.id} 
                      value={group.id}
                      className={FORM_PATTERNS.dropdown.item}
                    >
                      {group.name}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter className={FORM_PATTERNS.dialog.footer}>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={onConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {targetGroupId ? 'Move & Delete Group' : 'Delete All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog 
        open={showNewGroupDialog} 
        onOpenChange={onNewGroupDialogClose}
      >
        <AlertDialogContent className={FORM_PATTERNS.dialog.container}>
          <AlertDialogHeader className={FORM_PATTERNS.dialog.header}>
            <AlertDialogTitle>Create New Equipment Group</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a name for the new equipment group
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className={FORM_PATTERNS.field.group}>
            <Input
              placeholder="Enter group name"
              value={newGroupName}
              onChange={(e) => onNewGroupNameChange(e.target.value)}
              className={FORM_PATTERNS.input.default}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newGroupName.trim()) {
                  onConfirmCreate();
                }
              }}
              aria-label="Equipment group name"
            />
          </div>
          <AlertDialogFooter className={FORM_PATTERNS.dialog.footer}>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={onConfirmCreate}
              disabled={!newGroupName.trim()}
            >
              Create Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}