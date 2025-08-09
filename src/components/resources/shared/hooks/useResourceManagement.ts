import { useMemo, useState } from "react";
import { Resource, ResourceType, isCrewResource, isEquipmentResource } from "../../types/resource";
import { useCrewRoles } from "@/hooks/crew";
import { useFolders } from "@/hooks/ui";

type SortField = "name" | "updated" | "type" | "roles" | "stock";
type SortDirection = "asc" | "desc";

interface UseResourceManagementProps {
  resources: Resource[];
  searchQuery: string;
  selectedType: ResourceType | null;
}

export function useResourceManagement({
  resources,
  searchQuery,
  selectedType,
}: UseResourceManagementProps) {
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);

  const { roles } = useCrewRoles();
  const { folders } = useFolders();

  // Filter resources based on search, type, roles, and folders
  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      // Basic search and type filters
      const matchesSearch = searchQuery
        ? resource.name.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      const matchesType = selectedType ? resource.type === selectedType : true;

      // Role-specific filtering for crew
      const matchesRoles =
        selectedRoles.length > 0 && isCrewResource(resource)
          ? resource.roles.some((role) => selectedRoles.includes(role))
          : true;

      // Folder-specific filtering for equipment
      const matchesFolder =
        selectedFolders.length > 0 && isEquipmentResource(resource)
          ? selectedFolders.includes(resource.folder_id)
          : true;

      return matchesSearch && matchesType && matchesRoles && matchesFolder;
    });
  }, [resources, searchQuery, selectedType, selectedRoles, selectedFolders]);

  // Sort filtered resources
  const sortedResources = useMemo(() => {
    return [...filteredResources].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "updated":
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
        case "roles":
          if (isCrewResource(a) && isCrewResource(b)) {
            comparison = a.roles.length - b.roles.length;
          }
          break;
        case "stock":
          if (isEquipmentResource(a) && isEquipmentResource(b)) {
            comparison = a.stock - b.stock;
          }
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredResources, sortField, sortDirection]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoles((current) =>
      current.includes(roleId)
        ? current.filter((id) => id !== roleId)
        : [...current, roleId]
    );
  };

  const toggleFolder = (folderId: string) => {
    setSelectedFolders((current) =>
      current.includes(folderId)
        ? current.filter((id) => id !== folderId)
        : [...current, folderId]
    );
  };

  return {
    sortedResources,
    sortField,
    sortDirection,
    toggleSort,
    selectedRoles,
    selectedFolders,
    toggleRole,
    toggleFolder,
    roles,
    folders,
  };
}