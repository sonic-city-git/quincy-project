import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

type SortField = "name" | "updated" | "type" | "roles" | "stock";
type SortDirection = "asc" | "desc";

interface ResourceTableHeaderProps {
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  showSelection?: boolean;
  isAllSelected?: boolean;
  isPartiallySelected?: boolean;
  onSelectAll?: (checked: boolean) => void;
}

interface SortableHeaderProps {
  field: SortField;
  currentSort: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
  children: React.ReactNode;
}

function SortableHeader({
  field,
  currentSort,
  direction,
  onSort,
  children,
}: SortableHeaderProps) {
  const isActive = currentSort === field;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3"
      onClick={() => onSort(field)}
    >
      {children}
      {isActive ? (
        direction === "asc" ? (
          <ArrowUp className="ml-1 h-4 w-4" />
        ) : (
          <ArrowDown className="ml-1 h-4 w-4" />
        )
      ) : (
        <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />
      )}
    </Button>
  );
}

export function ResourceTableHeader({
  sortField,
  sortDirection,
  onSort,
  showSelection,
  isAllSelected,
  isPartiallySelected,
  onSelectAll,
}: ResourceTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow>
        {showSelection && (
          <TableHead className="w-[30px]">
            <Checkbox
              checked={isAllSelected}
              indeterminate={isPartiallySelected}
              onCheckedChange={onSelectAll}
            />
          </TableHead>
        )}
        <TableHead className="w-[300px]">
          <SortableHeader
            field="name"
            currentSort={sortField}
            direction={sortDirection}
            onSort={onSort}
          >
            Name
          </SortableHeader>
        </TableHead>
        <TableHead>
          <SortableHeader
            field="type"
            currentSort={sortField}
            direction={sortDirection}
            onSort={onSort}
          >
            Type
          </SortableHeader>
        </TableHead>
        <TableHead>
          <SortableHeader
            field="updated"
            currentSort={sortField}
            direction={sortDirection}
            onSort={onSort}
          >
            Last Updated
          </SortableHeader>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}