const roleOrder = ["FOH", "MON", "PLAYBACK", "BACKLINE"];

export const sortRolesByPriority = (roles: Array<{ name: string; id: string }>) => {
  return [...roles].sort((a, b) => {
    const roleA = a.name.toUpperCase();
    const roleB = b.name.toUpperCase();
    
    const indexA = roleOrder.indexOf(roleA);
    const indexB = roleOrder.indexOf(roleB);
    
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    
    return roleA.localeCompare(roleB);
  });
};