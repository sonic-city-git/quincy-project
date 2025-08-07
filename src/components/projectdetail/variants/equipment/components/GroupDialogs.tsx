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
            <AlertDialogTitle>Delete Group with Equipment</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                The group <strong>"{groups.find(g => g.id === groupToDelete)?.name || 'Unknown'}"</strong> contains equipment. 
                Choose what to do with the equipment:
              </p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• <strong>Move to another group:</strong> Select a target group below</li>
                <li>• <strong>Delete equipment with group:</strong> Leave selection empty to delete all equipment</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className={FORM_PATTERNS.field.group}>
            <Select value={targetGroupId} onValueChange={onTargetGroupSelect}>
              <SelectTrigger className={FORM_PATTERNS.dropdown.trigger}>
                <SelectValue placeholder="Select target group (or leave empty to delete equipment)" />
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
          {!targetGroupId && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive font-medium">⚠️ Warning</p>
              <p className="text-sm text-muted-foreground">
                No target group selected. All equipment in this group will be permanently deleted.
              </p>
            </div>
          )}
          <AlertDialogFooter className={FORM_PATTERNS.dialog.footer}>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={onConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {targetGroupId ? 'Move Equipment & Delete Group' : 'Delete Equipment & Group'}
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