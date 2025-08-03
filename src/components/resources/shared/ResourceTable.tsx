import { Table, TableBody } from "@/components/ui/table";
import { Resource, isCrewResource } from "../types/resource";
import { CrewResourceRow } from "../crew/CrewResourceRow";
import { EquipmentResourceRow } from "../equipment/EquipmentResourceRow";
import { ResourceTableHeader } from "./ResourceTableHeader";
import { Checkbox } from "@/components/ui/checkbox";

type SortField = "name" | "updated" | "type" | "roles" | "stock";
type SortDirection = "asc" | "desc";

interface ResourceTableProps {
  resources: Resource[];
  selectedItems: string[];
  onItemSelect: (id: string) => void;
  onItemsSelect: (ids: string[]) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

export function ResourceTable({
  resources,
  selectedItems,
  onItemSelect,
  onItemsSelect,
  sortField,
  sortDirection,
  onSort,
}: ResourceTableProps) {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onItemsSelect(resources.map(r => r.id));
    } else {
      onItemsSelect([]);
    }
  };

  const isAllSelected = resources.length > 0 && selectedItems.length === resources.length;
  const isPartiallySelected = selectedItems.length > 0 && selectedItems.length < resources.length;

  return (
    <div className="relative">
      <Table>
        <ResourceTableHeader
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={onSort}
          showSelection
          isAllSelected={isAllSelected}
          isPartiallySelected={isPartiallySelected}
          onSelectAll={handleSelectAll}
        />
        <TableBody>
          {resources.map((resource) => (
            isCrewResource(resource) ? (
              <CrewResourceRow
                key={resource.id}
                resource={resource}
                isSelected={selectedItems.includes(resource.id)}
                onSelect={() => onItemSelect(resource.id)}
                showCheckbox
              />
            ) : (
              <EquipmentResourceRow
                key={resource.id}
                resource={resource}
                isSelected={selectedItems.includes(resource.id)}
                onSelect={() => onItemSelect(resource.id)}
                showCheckbox
              />
            )
          ))}
        </TableBody>
      </Table>
    </div>
  );
}