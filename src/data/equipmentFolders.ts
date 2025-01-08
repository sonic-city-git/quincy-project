import { EquipmentFolder } from "@/types/equipment";

export const EQUIPMENT_FOLDERS: EquipmentFolder[] = [
  {
    id: "mixers",
    name: "Mixers",
    subfolders: [
      { id: "mixrack", name: "Mixrack" },
      { id: "surface", name: "Surface" },
      { id: "expansion", name: "Expansion" },
      { id: "small-format", name: "Small format" },
    ],
  },
  {
    id: "microphones",
    name: "Microphones",
    subfolders: [
      { id: "dynamic", name: "Dynamic" },
      { id: "condenser", name: "Condenser" },
      { id: "ribbon", name: "Ribbon" },
      { id: "shotgun", name: "Shotgun" },
      { id: "wl-capsule", name: "WL capsule" },
      { id: "special-misc", name: "Special/Misc" },
    ],
  },
  {
    id: "di-boxes",
    name: "DI-boxes",
    subfolders: [
      { id: "active", name: "Active" },
      { id: "passive", name: "Passive" },
      { id: "special", name: "Special" },
    ],
  },
  {
    id: "cables",
    name: "Cables/Split",
    subfolders: [
      { id: "cat", name: "CAT" },
      { id: "xlr", name: "XLR" },
      { id: "lk37-sb", name: "LK37/SB" },
      { id: "jack", name: "Jack" },
      { id: "coax", name: "Coax" },
      { id: "fibre", name: "Fibre" },
      { id: "schuko", name: "Schuko" },
    ],
  },
  { 
    id: "wl", 
    name: "WL",
    subfolders: [
      { id: "wl-mic", name: "MIC" },
      { id: "wl-iem", name: "IEM" },
      { id: "wl-antenna", name: "Antenna" },
    ],
  },
  { id: "outboard", name: "Outboard" },
  { id: "stands", name: "Stands/Clamps" },
  { id: "misc", name: "Misc" },
  { id: "flightcases", name: "Flightcases" },
  { id: "consumables", name: "Consumables" },
];

export const flattenFolders = (folders: EquipmentFolder[]): EquipmentFolder[] => {
  return folders.reduce((acc: EquipmentFolder[], folder) => {
    acc.push(folder);
    if (folder.subfolders) {
      acc.push(...folder.subfolders);
    }
    return acc;
  }, []);
};