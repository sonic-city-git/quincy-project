/**
 * CREW FOLDER SORTING ORDER
 * 
 * Defines the priority order for crew folders across the entire application.
 * Sonic City crew should always appear first, followed by Associates, then Freelancers.
 */

// Priority order for crew folders (similar to FOLDER_ORDER for equipment)
export const CREW_FOLDER_ORDER = [
  "Sonic City",
  "Associates", 
  "Freelancers"
] as const;

/**
 * Sort crew folders according to the predefined priority order
 */
export function sortCrewFolders(folders: { id: string; name: string; }[]): { id: string; name: string; }[] {
  return folders.sort((a, b) => {
    const indexA = CREW_FOLDER_ORDER.indexOf(a.name as any);
    const indexB = CREW_FOLDER_ORDER.indexOf(b.name as any);
    
    // If both are in the priority order, sort by index
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    
    // If only one is in the priority order, prioritize it
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    
    // If neither is in the priority order, sort alphabetically
    return a.name.localeCompare(b.name);
  });
}

/**
 * Sort crew folder names (string array version)
 */
export function sortCrewFolderNames(folderNames: string[]): string[] {
  return folderNames.sort((a, b) => {
    const indexA = CREW_FOLDER_ORDER.indexOf(a as any);
    const indexB = CREW_FOLDER_ORDER.indexOf(b as any);
    
    // If both are in the priority order, sort by index
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    
    // If only one is in the priority order, prioritize it
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    
    // If neither is in the priority order, sort alphabetically
    return a.localeCompare(b);
  });
}