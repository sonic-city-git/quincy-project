/**
 * EQUIPMENT FOLDER SORTING SYSTEM
 * 
 * Consolidates equipment folder ordering logic.
 * Uses the definitive FOLDER_ORDER and SUBFOLDER_ORDER from @/types/equipment
 */

import { FOLDER_ORDER, SUBFOLDER_ORDER, MainFolder } from "@/types/equipment";

// Re-export the orders for convenience
export { FOLDER_ORDER, SUBFOLDER_ORDER } from "@/types/equipment";
export type { MainFolder } from "@/types/equipment";

/**
 * Sort equipment folders according to the predefined hierarchy order
 */
export function sortEquipmentFolders(folders: { id: string; name: string; parent_id: string | null; }[]) {
  // First, separate main folders and subfolders
  const mainFolders = folders.filter(folder => !folder.parent_id);
  const subfolders = folders.filter(folder => folder.parent_id);

  // Sort main folders according to FOLDER_ORDER
  const sortedMainFolders = mainFolders.sort((a, b) => {
    const indexA = FOLDER_ORDER.indexOf(a.name as MainFolder);
    const indexB = FOLDER_ORDER.indexOf(b.name as MainFolder);
    
    // If both are in the order, sort by index
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    
    // If only one is in the order, prioritize it
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    
    // If neither is in the order, sort alphabetically
    return a.name.localeCompare(b.name);
  });

  // For each main folder, sort its subfolders according to SUBFOLDER_ORDER
  return sortedMainFolders.flatMap(mainFolder => {
    const folderSubfolders = subfolders
      .filter(sub => sub.parent_id === mainFolder.id)
      .sort((a, b) => {
        const orderArray = SUBFOLDER_ORDER[mainFolder.name as MainFolder] || [];
        const indexA = orderArray.indexOf(a.name);
        const indexB = orderArray.indexOf(b.name);
        
        // If both are in the order, sort by index
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        
        // If only one is in the order, prioritize it
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        
        // If neither is in the order, sort alphabetically
        return a.name.localeCompare(b.name);
      });

    return [mainFolder, ...folderSubfolders];
  });
}

/**
 * Create ordered folder structure for equipment with hierarchy levels (like planner)
 */
export function createOrderedEquipmentFolders(
  folders: { id: string; name: string; parent_id: string | null; }[],
  groupedEquipment: Record<string, any[]>
): Array<{path: string, level: number, isSubfolder: boolean, equipment: any[]}> {
  const mainFolders = folders.filter(f => !f.parent_id);
  const subFolders = folders.filter(f => f.parent_id);
  
  const orderedFolders: Array<{path: string, level: number, isSubfolder: boolean, equipment: any[]}> = [];
  
  FOLDER_ORDER.forEach(folderName => {
    const mainFolder = mainFolders.find(f => f.name === folderName);
    if (!mainFolder) return;
    
    // Check if this main folder has equipment OR any subfolders with equipment
    const hasDirectEquipment = groupedEquipment[folderName]?.length > 0;
    const folderSubfolders = subFolders
      .filter(sf => sf.parent_id === mainFolder.id)
      .sort((a, b) => {
        const orderArray = SUBFOLDER_ORDER[folderName] || [];
        const indexA = orderArray.indexOf(a.name);
        const indexB = orderArray.indexOf(b.name);
        return indexA - indexB;
      });
      
    const hasSubfoldersWithEquipment = folderSubfolders.some(subfolder => {
      const subfolderPath = `${folderName}/${subfolder.name}`;
      return groupedEquipment[subfolderPath]?.length > 0;
    });
    
    // Only show main folder if it has equipment directly OR subfolders with equipment
    if (hasDirectEquipment || hasSubfoldersWithEquipment) {
      // Add main folder (even if empty, for hierarchy)
      orderedFolders.push({
        path: folderName,
        level: 0, 
        isSubfolder: false,
        equipment: groupedEquipment[folderName] || []
      });
      
      // Add its subfolders with indentation
      folderSubfolders.forEach(subfolder => {
        const subfolderPath = `${folderName}/${subfolder.name}`;
        if (groupedEquipment[subfolderPath]?.length > 0) {
          orderedFolders.push({
            path: subfolderPath,
            level: 1,
            isSubfolder: true,
            equipment: groupedEquipment[subfolderPath]
          });
        }
      });
    }
  });
  
  return orderedFolders;
}