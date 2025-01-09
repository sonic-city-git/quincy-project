export const ROLE_ORDER = ["FOH", "MON", "PLB", "BCK", "PM", "TM"];

export const sortRoles = <T extends { name: string }>(roles: T[]): T[] => {
  return [...roles].sort((a, b) => {
    const indexA = ROLE_ORDER.indexOf(a.name);
    const indexB = ROLE_ORDER.indexOf(b.name);
    
    // If both roles are in our predefined order
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    
    // If only one role is in predefined order, prioritize it
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    
    // For roles not in predefined order, sort alphabetically
    return a.name.localeCompare(b.name);
  });
};