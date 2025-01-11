import { useState } from "react";
import { CrewMember } from "@/types/crew";

export function useCrewFilters() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles(prev => {
      if (prev.includes(roleId)) {
        return prev.filter(id => id !== roleId);
      }
      return [...prev, roleId];
    });
  };

  const clearFilters = () => {
    setSelectedRoles([]);
    setSearchQuery('');
  };

  const filterCrew = (crew: CrewMember[]) => {
    return crew.filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (member.email && member.email.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRoles = selectedRoles.length === 0 || 
        selectedRoles.every(roleId => member.roles?.includes(roleId));

      return matchesSearch && matchesRoles;
    });
  };

  return {
    searchQuery,
    setSearchQuery,
    selectedRoles,
    handleRoleToggle,
    clearFilters,
    filterCrew
  };
}