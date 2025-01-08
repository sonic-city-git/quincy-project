import { EquipmentFolder } from "@/types/equipment";

export const EQUIPMENT_FOLDERS: EquipmentFolder[] = [
  {
    id: "mixers",
    name: "a.Mixers",
    subfolders: [
      { id: "mixrack", name: "Mixrack" },
      { id: "surface", name: "Surface" },
      { id: "expansion", name: "Expansion" },
      { id: "small-format", name: "Small format" },
    ],
  },
  {
    id: "microphones",
    name: "b.Microphones",
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
    name: "c.DI-boxes",
    subfolders: [
      { id: "active", name: "Active" },
      { id: "passive", name: "Passive" },
      { id: "special", name: "Special" },
    ],
  },
  {
    id: "cables",
    name: "d.Cables/Split",
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
    name: "e.WL",
    subfolders: [
      { id: "wl-mic", name: "a.MIC" },
      { id: "wl-iem", name: "b.IEM" },
      { id: "wl-antenna", name: "c.Antenna" },
    ],
  },
  { id: "outboard", name: "f.Outboard" },
  { id: "stands", name: "g.Stands/Clamps" },
  { id: "misc", name: "h.Misc" },
  { id: "flightcases", name: "i.Flightcases" },
  { id: "consumables", name: "j.Consumables" },
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