import { RatesHeader } from "./RatesHeader";
import { RolesList } from "./RolesList";

interface RatesListProps {
  projectRoles: any[];
  selectedItems: string[];
  onUpdate: () => void;
}

export function RatesList({ projectRoles, selectedItems, onUpdate }: RatesListProps) {
  return (
    <>
      <RatesHeader />
      <RolesList
        projectRoles={projectRoles}
        selectedItems={selectedItems}
        onUpdate={onUpdate}
      />
    </>
  );
}