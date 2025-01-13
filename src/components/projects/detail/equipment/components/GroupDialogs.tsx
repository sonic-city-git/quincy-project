import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface GroupDialogsProps {
  groups: any[];
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription>
              This group contains equipment. Would you like to move the equipment to another group or delete it?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={targetGroupId} onValueChange={onTargetGroupSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a target group (or leave empty to delete equipment)" />
              </SelectTrigger>
              <SelectContent>
                {groups
                  .filter(g => g.id !== groupToDelete)
                  .map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete}>
              {targetGroupId ? 'Move & Delete Group' : 'Delete All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog 
        open={showNewGroupDialog} 
        onOpenChange={onNewGroupDialogClose}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create New Equipment Group</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a name for the new equipment group
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter group name"
              value={newGroupName}
              onChange={(e) => onNewGroupNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newGroupName.trim()) {
                  onConfirmCreate();
                }
              }}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmCreate}>
              Create Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}