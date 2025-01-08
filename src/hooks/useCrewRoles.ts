import { useState, useCallback } from "react";

export function useCrewRoles() {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const handleRoleSelect = useCallback((role: string, checked: boolean) => {
    setSelectedRoles(prev =>
      checked
        ? [...prev, role]
        : prev.filter((r) => r !== role)
    );
  }, []);

  return {
    selectedRoles,
    handleRoleSelect,
  };
}