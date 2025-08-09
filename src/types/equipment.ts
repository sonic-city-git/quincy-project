import { Database } from "@/integrations/supabase/types";

export type Equipment = Database["public"]["Tables"]["equipment"]["Row"];

export const FOLDER_ORDER = [
  "Subrental",
  "Mixers",
  "Microphones",
  "DI-boxes",
  "Cables",
  "WL",
  "Outboard",
  "Stands",
  "Misc",
  "Flightcases",
  "Consumables",
  "Kits",
  "Mindnes"
] as const;

export type MainFolder = typeof FOLDER_ORDER[number];

export const SUBFOLDER_ORDER: Record<MainFolder, readonly string[]> = {
  "Subrental": [],
  "Mixers": ["Mixrack", "Surface", "Expansion", "Small format"],
  "Microphones": ["Dynamic", "Condenser", "Ribbon", "Shotgun", "WL capsule", "Special/Misc"],
  "DI-boxes": ["Active", "Passive", "Special"],
  "Cables": ["CAT", "XLR", "LK37/SB", "Jack", "Coax", "Fibre", "Schuko"],
  "WL": ["MIC", "IEM", "Antenna"],
  "Outboard": [],
  "Stands": [],
  "Misc": [],
  "Flightcases": [],
  "Consumables": [],
  "Kits": [],
  "Mindnes": []
} as const;

export type SubFolder = typeof SUBFOLDER_ORDER[MainFolder][number];

export interface EquipmentFolder {
  id: string;
  name: MainFolder | SubFolder;
  parent_id: string | null;
  created_at?: string;
}

export interface EquipmentWithFolder extends Equipment {
  folder?: EquipmentFolder;
  parent_folder?: EquipmentFolder;
}

export type EquipmentStatus = 
  | "available"    // Ready for use
  | "in_use"       // Currently allocated
  | "maintenance"  // Under maintenance
  | "damaged"      // Needs repair
  | "retired";     // No longer in service

export interface EquipmentRate {
  hourly_rate?: number;
  daily_rate: number;
  weekly_rate?: number;
  monthly_rate?: number;
  currency: string;
}

export interface EquipmentSerialNumber {
  id: string;
  equipment_id: string;
  serial_number: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectEquipment {
  id: string;
  equipment_id: string;
  name: string;
  code: string | null;
  quantity: number;
  rental_price: number | null;
  group_id: string | null;
}

// Subrental functionality
export interface SubrentalSuggestion {
  equipmentId: string;
  equipmentName: string;
  date: string;
  overbooked: number;
  affectedEvents: Array<{
    eventName: string;
    projectName: string;
    quantity: number;
  }>;
  suggestedProviders: ExternalProvider[];
}

export interface ExternalProvider {
  id: string;
  company_name: string;
  contact_email: string | null;
  phone: string | null;
  website: string | null;
  geographic_coverage: string[] | null;
  reliability_rating: number | null;
  preferred_status: boolean;
}

export interface SubrentalEquipment {
  id: string;
  name: string;
  temporary_serial: string; // e.g., "Oslo Equipment Rentals MX1 #1"
  provider_id: string;
  provider_name: string;
  start_date: string;
  end_date: string;
  cost: number | null;
  notes: string | null;
  equipment_type: string; // Original equipment name this replaces
  equipment_id: string; // Reference to original equipment
}