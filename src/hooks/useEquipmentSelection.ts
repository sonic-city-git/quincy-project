import { useState } from "react";
import { Equipment } from "@/types/equipment";

export function useEquipmentSelection() {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleItemSelect = (id: string) => {
    setSelectedItems((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

  const handleSelectAll = (equipment: Equipment[]) => {
    if (selectedItems.length === equipment.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(equipment.map(item => item.id));
    }
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  return {
    selectedItems,
    handleItemSelect,
    handleSelectAll,
    clearSelection,
  };
}