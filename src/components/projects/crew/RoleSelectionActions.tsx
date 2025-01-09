interface RoleSelectionActionsProps {
  selectedItems: string[];
  onEdit: () => void;
}

export function RoleSelectionActions({ selectedItems, onEdit }: RoleSelectionActionsProps) {
  // Since we moved the edit button to the header, this component is now empty when items are selected
  return null;
}