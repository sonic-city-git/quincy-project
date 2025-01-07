import { EquipmentFolder } from "@/types/equipment";
import { EQUIPMENT_FOLDERS } from "@/data/equipmentFolders";

export const isItemInFolder = (itemFolderId: string | undefined, selectedFolderId: string | null): boolean => {
  if (!selectedFolderId || !itemFolderId) return false;

  // Direct match
  if (itemFolderId === selectedFolderId) return true;

  // Check if the item's folder is a subfolder of the selected folder
  const findParentFolder = (folders: EquipmentFolder[], targetId: string): boolean => {
    for (const folder of folders) {
      if (folder.id === selectedFolderId) {
        return !!folder.subfolders?.some(sub => sub.id === targetId);
      }
      if (folder.subfolders) {
        if (findParentFolder(folder.subfolders, targetId)) {
          return true;
        }
      }
    }
    return false;
  };

  return findParentFolder(EQUIPMENT_FOLDERS, itemFolderId);
};

export const getFolderPath = (folderId: string | null, folders: EquipmentFolder[]): string => {
  if (!folderId) return 'All folders';

  for (const folder of folders) {
    if (folder.id === folderId) {
      return folder.name;
    }
    if (folder.subfolders) {
      for (const subfolder of folder.subfolders) {
        if (subfolder.id === folderId) {
          return `${folder.name} -> ${subfolder.name}`;
        }
      }
    }
  }
  return 'All folders';
};