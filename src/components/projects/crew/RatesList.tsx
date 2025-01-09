import { RatesHeader } from "./RatesHeader";
import { RolesList } from "./RolesList";

interface RatesListProps {
  projectRoles: any[];
  selectedItems: string[];
  onUpdate: () => void;
  onItemSelect: (roleId: string) => void;
}

export function RatesList({ projectRoles, selectedItems, onUpdate, onItemSelect }: RatesListProps) {
  return (
    <>
      <RatesHeader />
      <RolesList
        projectRoles={projectRoles}
        selectedItems={selectedItems}
        onUpdate={onUpdate}
        onItemSelect={onItemSelect}
      />
    </>
  );
}