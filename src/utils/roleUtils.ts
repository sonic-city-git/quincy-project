export const ROLE_ORDER = ["FOH", "MON", "PLB", "BCK", "PM", "TM"];

export const sortRoles = <T extends { name: string }>(roles: T[]): T[] => {
  return [...roles].sort((a, b) => {
    const roleA = a.name.toUpperCase();
    const roleB = b.name.toUpperCase();
    
    const indexA = ROLE_ORDER.indexOf(roleA);
    const indexB = ROLE_ORDER.indexOf(roleB);
    
    // If both roles are in the order array, sort by their position
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    // If only roleA is in the order array, it comes first
    if (indexA !== -1) return -1;
    // If only roleB is in the order array, it comes first
    if (indexB !== -1) return 1;
    // For roles not in the order array, sort alphabetically
    return roleA.localeCompare(roleB);
  });
};