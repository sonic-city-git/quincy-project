// Equipment Section Component
// Displays and manages equipment items and groups for a specific variant

import { useState } from 'react';
import { 
  Package, 
  ChevronDown, 
  ChevronRight, 
  MoreHorizontal, 
  Plus,
  Pencil,
  Trash2,
  Hash,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  VariantEquipmentGroup,
  VariantEquipmentItem 
} from '@/types/variants';
import { formatPrice } from '@/utils/priceFormatters';
import { cn } from '@/lib/utils';

interface EquipmentSectionProps {
  projectId: string;
  variantName: string;
  equipmentGroups: VariantEquipmentGroup[];
  ungroupedEquipment: VariantEquipmentItem[];
  expandedGroups: Set<string>;
  onToggleGroup: (groupId: string) => void;
  onAddItem: (itemData: Omit<VariantEquipmentItem, 'id' | 'project_id' | 'variant_name'>) => Promise<VariantEquipmentItem>;
  onUpdateItem: (itemId: string, updates: Partial<VariantEquipmentItem>) => Promise<VariantEquipmentItem>;
  onRemoveItem: (itemId: string) => Promise<void>;
  onCreateGroup: (groupData: { name: string; sort_order?: number }) => Promise<VariantEquipmentGroup>;
  onUpdateGroup: (groupId: string, updates: Partial<VariantEquipmentGroup>) => Promise<VariantEquipmentGroup>;
  onDeleteGroup: (groupId: string, moveItemsToGroupId?: string) => Promise<void>;
}

export function EquipmentSection({
  projectId,
  variantName,
  equipmentGroups,
  ungroupedEquipment,
  expandedGroups,
  onToggleGroup,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup
}: EquipmentSectionProps) {
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);

  const totalItems = equipmentGroups.reduce((sum, group) => sum + group.equipment_items.length, 0) + ungroupedEquipment.length;

  if (totalItems === 0) {
    return (
      <div className="text-center py-8 border border-dashed border-border rounded-lg">
        <Package className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <h4 className="font-medium text-muted-foreground mb-2">No equipment configured</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Add equipment items to define what gear you need for this variant
        </p>
        <div className="flex justify-center gap-2">
          <Button size="sm" variant="outline">
            Add Equipment
          </Button>
          <Button size="sm" variant="outline">
            Create Group
          </Button>
        </div>
      </div>
    );
  }

  // Sort groups by sort_order
  const sortedGroups = [...equipmentGroups].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  return (
    <div className="space-y-4">
      {/* Equipment Groups */}
      {sortedGroups.map((group) => (
        <EquipmentGroupCard
          key={group.id}
          group={group}
          isExpanded={expandedGroups.has(group.id)}
          onToggleExpanded={() => onToggleGroup(group.id)}
          onEditGroup={() => setEditingGroup(group.id)}
          onDeleteGroup={() => onDeleteGroup(group.id)}
          onEditItem={setEditingItem}
          onRemoveItem={onRemoveItem}
        />
      ))}

      {/* Ungrouped Equipment */}
      {ungroupedEquipment.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium text-sm">Ungrouped Equipment</h4>
                <Badge variant="outline" className="text-xs">
                  {ungroupedEquipment.length}
                </Badge>
              </div>
              <Button size="sm" variant="ghost" className="gap-2">
                <Plus className="h-3 w-3" />
                Add Item
              </Button>
            </div>
            
            <div className="space-y-2">
              {ungroupedEquipment.map((item) => (
                <EquipmentItemRow
                  key={item.id}
                  item={item}
                  onEdit={() => setEditingItem(item.id)}
                  onRemove={() => onRemoveItem(item.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface EquipmentGroupCardProps {
  group: VariantEquipmentGroup;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onEditGroup: () => void;
  onDeleteGroup: () => void;
  onEditItem: (itemId: string) => void;
  onRemoveItem: (itemId: string) => Promise<void>;
}

function EquipmentGroupCard({
  group,
  isExpanded,
  onToggleExpanded,
  onEditGroup,
  onDeleteGroup,
  onEditItem,
  onRemoveItem
}: EquipmentGroupCardProps) {
  const { name, equipment_items } = group;
  const itemCount = equipment_items.length;
  const totalValue = equipment_items.reduce((sum, item) => {
    const price = item.equipment.rental_price || 0;
    return sum + (price * item.quantity);
  }, 0);

  return (
    <Card>
      <CardContent className="p-0">
        {/* Group Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpanded}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm truncate">{name}</h4>
                <Badge variant="outline" className="text-xs">
                  {itemCount} item{itemCount !== 1 ? 's' : ''}
                </Badge>
                {totalValue > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {formatPrice(totalValue)}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="gap-2">
              <Plus className="h-3 w-3" />
              Add Item
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEditGroup} className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit Group
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={onDeleteGroup} 
                  className="gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Group
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Group Content */}
        {isExpanded && (
          <div className="p-4 pt-0">
            {itemCount === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Package className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No equipment in this group</p>
                <Button size="sm" variant="outline" className="mt-2 gap-2">
                  <Plus className="h-3 w-3" />
                  Add First Item
                </Button>
              </div>
            ) : (
              <div className="space-y-2 mt-3">
                {equipment_items.map((item) => (
                  <EquipmentItemRow
                    key={item.id}
                    item={item}
                    onEdit={() => onEditItem(item.id)}
                    onRemove={() => onRemoveItem(item.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface EquipmentItemRowProps {
  item: VariantEquipmentItem;
  onEdit: () => void;
  onRemove: () => void;
}

function EquipmentItemRow({ item, onEdit, onRemove }: EquipmentItemRowProps) {
  const { equipment, quantity, notes } = item;
  const totalPrice = (equipment.rental_price || 0) * quantity;

  return (
    <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors">
      {/* Left side - Equipment info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h5 className="font-medium text-sm truncate">
              {equipment.name}
            </h5>
            
            {equipment.code && (
              <Badge variant="outline" className="text-xs font-mono">
                {equipment.code}
              </Badge>
            )}
            
            <Badge variant="secondary" className="text-xs">
              <Hash className="h-3 w-3 mr-1" />
              {quantity}
            </Badge>
            
            {equipment.rental_price && (
              <Badge variant="outline" className="text-xs">
                <DollarSign className="h-3 w-3 mr-1" />
                {formatPrice(totalPrice)}
              </Badge>
            )}
          </div>
          
          {notes && (
            <p className="text-xs text-muted-foreground truncate">
              {notes}
            </p>
          )}
        </div>
      </div>

      {/* Right side - Stock & Actions */}
      <div className="flex items-center gap-3">
        {/* Stock indicator */}
        {equipment.stock !== undefined && (
          <div className="text-xs text-muted-foreground">
            <span className={cn(
              "font-medium",
              quantity > equipment.stock ? "text-destructive" : "text-muted-foreground"
            )}>
              {equipment.stock} available
            </span>
          </div>
        )}

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit} className="gap-2">
              <Pencil className="h-4 w-4" />
              Edit Item
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={onRemove} 
              className="gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Remove Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}