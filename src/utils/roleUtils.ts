export const ROLE_ORDER = ["FOH", "MON", "PLB", "BCK", "PM", "TM"];

export const sortRoles = <T extends { name: string }>(roles: T[]): T[] => {
  return [...roles].sort((a, b) => {
    const roleA = a.name.toUpperCase();
    const roleB = b.name.toUpperCase();
    
    const indexA = ROLE_ORDER.indexOf(roleA);
    const indexB = ROLE_ORDER.indexOf(roleB);
    
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    
    return roleA.localeCompare(roleB);
  });
};