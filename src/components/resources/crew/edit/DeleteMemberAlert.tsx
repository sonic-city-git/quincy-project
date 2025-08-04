/**
 * CONSOLIDATED: DeleteMemberAlert - Now using generic ConfirmationDialog  
 * Reduced from 51 lines to 20 lines (61% reduction)
 */

import { DeleteConfirmationDialog } from "@/components/shared/dialogs/ConfirmationDialog";

interface DeleteMemberAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
  memberName: string;
}

export function DeleteMemberAlert({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  memberName,
}: DeleteMemberAlertProps) {
  return (
    <DeleteConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      itemName={memberName}
      itemType="crew member"
      isPending={isPending}
      confirmText="Delete Member"
    />
  );
}