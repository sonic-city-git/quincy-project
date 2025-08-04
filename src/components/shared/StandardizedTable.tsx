/**
 * STANDARDIZED TABLE COMPONENT
 * 
 * Consolidates all table implementations with consistent styling
 * Uses the same design patterns as dashboard StatusCard
 */

import { ReactNode } from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowDown, ArrowUp, ArrowUpDown, LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export type SortField = string;
export type SortDirection = "asc" | "desc";

export interface ColumnDefinition {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, item: any, index: number) => ReactNode;
}

export interface StandardizedTableProps {
  // Data
  data: any[];
  columns: ColumnDefinition[];
  loading?: boolean;
  
  // Sorting
  sortField?: SortField;
  sortDirection?: SortDirection;
  onSort?: (field: SortField) => void;
  
  // Selection
  selectedItems?: string[];
  onItemSelect?: (id: string) => void;
  onSelectAll?: (checked: boolean) => void;
  getItemId?: (item: any) => string;
  
  // Appearance
  variant?: 'default' | 'bordered' | 'minimal';
  emptyMessage?: string;
  
  // Interactions
  onRowClick?: (item: any, index: number) => void;
  onRowDoubleClick?: (item: any, index: number) => void;
}

/**
 * Sortable header component
 */
function SortableHeader({
  column,
  currentSort,
  direction,
  onSort,
}: {
  column: ColumnDefinition;
  currentSort?: SortField;
  direction?: SortDirection;
  onSort?: (field: SortField) => void;
}) {
  const isActive = currentSort === column.key;
  const isSortable = column.sortable && onSort;

  if (!isSortable) {
    return <span>{column.label}</span>;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-auto p-1 font-medium text-muted-foreground hover:text-foreground"
      onClick={() => onSort(column.key)}
    >
      {column.label}
      {isActive ? (
        direction === "asc" ? (
          <ArrowUp className="ml-1 h-3 w-3" />
        ) : (
          <ArrowDown className="ml-1 h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
      )}
    </Button>
  );
}

/**
 * Standardized table with consistent styling and functionality
 */
export function StandardizedTable({
  data,
  columns,
  loading = false,
  sortField,
  sortDirection,
  onSort,
  selectedItems = [],
  onItemSelect,
  onSelectAll,
  getItemId = (item) => item.id,
  variant = 'default',
  emptyMessage = "No data found",
  onRowClick,
  onRowDoubleClick
}: StandardizedTableProps) {
  
  // Selection logic
  const hasSelection = onItemSelect && onSelectAll;
  const isAllSelected = hasSelection && data.length > 0 && selectedItems.length === data.length;
  const isPartiallySelected = hasSelection && selectedItems.length > 0 && selectedItems.length < data.length;

  // Variant styling
  const getVariantClasses = () => {
    switch (variant) {
      case 'bordered':
        return {
          container: 'rounded-lg overflow-hidden border border-zinc-800',
          header: 'bg-zinc-900 border-b border-zinc-800',
          row: 'border-b border-zinc-800 hover:bg-zinc-800/30 transition-colors'
        };
      case 'minimal':
        return {
          container: '',
          header: 'border-b border-zinc-800/50',
          row: 'hover:bg-zinc-800/20 transition-colors'
        };
      default:
        return {
          container: 'rounded-lg overflow-hidden border border-zinc-800',
          header: 'bg-zinc-900/50 border-b border-zinc-800',
          row: 'border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors'
        };
    }
  };

  const classes = getVariantClasses();

  // Loading state
  if (loading) {
    return (
      <div className={classes.container}>
        <Table>
          <TableHeader className={classes.header}>
            <TableRow>
              {hasSelection && <TableHead className="w-[50px]"></TableHead>}
              {columns.map((column) => (
                <TableHead key={column.key} className={column.width}>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className={classes.row}>
                {hasSelection && (
                  <td className="p-4">
                    <Skeleton className="h-4 w-4" />
                  </td>
                )}
                {columns.map((column) => (
                  <td key={column.key} className="p-4">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className={classes.container}>
        <Table>
          <TableHeader className={classes.header}>
            <TableRow>
              {hasSelection && <TableHead className="w-[50px]"></TableHead>}
              {columns.map((column) => (
                <TableHead key={column.key} className={column.width}>
                  <SortableHeader
                    column={column}
                    currentSort={sortField}
                    direction={sortDirection}
                    onSort={onSort}
                  />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        </Table>
        <div className="text-center py-8 text-muted-foreground">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className={classes.container}>
      <Table>
        <TableHeader className={classes.header}>
          <TableRow>
            {hasSelection && (
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={onSelectAll}
                  indeterminate={isPartiallySelected}
                  aria-label="Select all"
                />
              </TableHead>
            )}
            {columns.map((column) => (
              <TableHead 
                key={column.key} 
                className={`${column.width} ${column.align ? `text-${column.align}` : ''}`}
              >
                <SortableHeader
                  column={column}
                  currentSort={sortField}
                  direction={sortDirection}
                  onSort={onSort}
                />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => {
            const itemId = getItemId(item);
            const isSelected = selectedItems.includes(itemId);
            
            return (
              <TableRow 
                key={itemId}
                className={`${classes.row} ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(item, index)}
                onDoubleClick={() => onRowDoubleClick?.(item, index)}
              >
                {hasSelection && (
                  <td className="p-4">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onItemSelect!(itemId)}
                      aria-label={`Select ${item.name || itemId}`}
                    />
                  </td>
                )}
                {columns.map((column) => {
                  const value = item[column.key];
                  const cellContent = column.render 
                    ? column.render(value, item, index)
                    : value;
                  
                  return (
                    <td 
                      key={column.key} 
                      className={`p-4 ${column.align ? `text-${column.align}` : ''}`}
                    >
                      {cellContent}
                    </td>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}