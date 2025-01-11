import { useState } from "react";

export function useEquipmentFilters() {
  const [searchQuery, setSearchQuery] = useState('');

  const clearFilters = () => {
    setSearchQuery('');
  };

  const filterEquipment = (equipment: any[]) => {
    return equipment.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.code && item.code.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSearch;
    });
  };

  return {
    searchQuery,
    setSearchQuery,
    clearFilters,
    filterEquipment
  };
}