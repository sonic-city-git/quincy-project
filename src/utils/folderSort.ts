export const FOLDER_ORDER = [
  "Mixers",
  "Microphones",
  "DI-boxes",
  "Cables/Split",
  "WL",
  "Outboard",
  "Stands/Clamps",
  "Misc",
  "Flightcases",
  "Consumables",
  "Kits",
  "Mindnes"
];

export const SUBFOLDER_ORDER: Record<string, string[]> = {
  "Mixers": ["Mixrack", "Surface", "Expansion", "Small format"],
  "Microphones": ["Dynamic", "Condenser", "Ribbon", "Shotgun", "WL capsule", "Special/Misc"],
  "DI-boxes": ["Active", "Passive", "Special"],
  "Cables/Split": ["CAT", "XLR", "LK37/SB", "Jack", "Coax", "Fibre", "Schuko"],
  "WL": ["MIC", "IEM", "Antenna"]
};

export function sortFolders(folders: { id: string; name: string; parent_id: string | null; }[]) {
  // First, separate main folders and subfolders
  const mainFolders = folders.filter(folder => !folder.parent_id);
  const subfolders = folders.filter(folder => folder.parent_id);

  // Sort main folders according to FOLDER_ORDER
  const sortedMainFolders = mainFolders.sort((a, b) => {
    const indexA = FOLDER_ORDER.indexOf(a.name);
    const indexB = FOLDER_ORDER.indexOf(b.name);
    return indexA - indexB;
  });

  // For each main folder, sort its subfolders according to SUBFOLDER_ORDER
  return sortedMainFolders.flatMap(mainFolder => {
    const folderSubfolders = subfolders
      .filter(sub => sub.parent_id === mainFolder.id)
      .sort((a, b) => {
        const orderArray = SUBFOLDER_ORDER[mainFolder.name] || [];
        const indexA = orderArray.indexOf(a.name);
        const indexB = orderArray.indexOf(b.name);
        return indexA - indexB;
      });

    return [mainFolder, ...folderSubfolders];
  });
}