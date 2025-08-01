/**
 * Optimized data structures for Equipment Planner
 * 
 * These flattened structures replace the complex nested Maps
 * for better performance and easier manipulation
 */

export interface FlattenedEquipment {
  id: string;
  name: string;
  stock: number;
  folderPath: string; // e.g., "Mixers/Digital Mixers" or "Mixers"
  mainFolder: string; // e.g., "Mixers"
  subFolder?: string; // e.g., "Digital Mixers" (optional)
  level: number; // 0 = main folder, 1 = main folder equipment, 2 = subfolder equipment
}

export interface EquipmentBookingFlat {
  equipmentId: string;
  equipmentName: string;
  date: string; // yyyy-MM-dd format
  stock: number;
  bookings: Array<{
    quantity: number;
    projectName: string;
    eventName: string;
  }>;
  totalUsed: number;
  isOverbooked: boolean;
  folderPath: string;
}

export interface EquipmentGroup {
  mainFolder: string;
  equipment: FlattenedEquipment[];
  subFolders: EquipmentSubFolder[];
  isExpanded: boolean;
}

export interface EquipmentSubFolder {
  name: string;
  mainFolder: string;
  equipment: FlattenedEquipment[];
  isExpanded: boolean;
}

export interface EquipmentPlannerData {
  groups: EquipmentGroup[];
  bookingsByEquipmentDate: Map<string, EquipmentBookingFlat>; // key: "equipmentId-date"
  equipmentById: Map<string, FlattenedEquipment>;
  isLoading: boolean;
  error?: string;
}

// Helper function to generate booking key
export const getBookingKey = (equipmentId: string, dateStr: string): string => 
  `${equipmentId}-${dateStr}`;

// Helper function to get equipment hierarchy level
export const getEquipmentLevel = (equipment: FlattenedEquipment): number => {
  if (equipment.subFolder) return 2; // Subfolder equipment
  return 1; // Main folder equipment
};

// Helper function to check if equipment matches filter
export const matchesEquipmentFilter = (
  equipment: FlattenedEquipment, 
  searchQuery?: string,
  folderFilter?: string
): boolean => {
  if (searchQuery && !equipment.name.toLowerCase().includes(searchQuery.toLowerCase())) {
    return false;
  }
  
  if (folderFilter && equipment.mainFolder !== folderFilter) {
    return false;
  }
  
  return true;
};

// Helper function to sort equipment groups
export const sortEquipmentGroups = (
  groups: EquipmentGroup[], 
  folderOrder: string[]
): EquipmentGroup[] => {
  return groups.sort((a, b) => {
    const indexA = folderOrder.indexOf(a.mainFolder);
    const indexB = folderOrder.indexOf(b.mainFolder);
    
    if (indexA === -1 && indexB === -1) return a.mainFolder.localeCompare(b.mainFolder);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    
    return indexA - indexB;
  });
};

// Helper function to sort equipment within groups
export const sortEquipmentInGroup = (equipment: FlattenedEquipment[]): FlattenedEquipment[] => {
  return equipment.sort((a, b) => a.name.localeCompare(b.name));
};