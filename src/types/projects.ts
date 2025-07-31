import { Database } from "@/integrations/supabase/types";
import { EquipmentRate } from "./equipment";
import { CrewRole } from "./crew";

export type Project = Database["public"]["Tables"]["projects"]["Row"];

export type ProjectStatus =
  | "draft"      // Initial planning stage
  | "pending"    // Awaiting approval/confirmation
  | "confirmed"  // Ready for execution
  | "active"     // Currently running
  | "completed"  // Finished successfully
  | "cancelled"  // Terminated before completion
  | "archived";  // Historical record

export const PROJECT_STATUS_FLOW = {
  draft: ["pending", "cancelled"],
  pending: ["confirmed", "cancelled"],
  confirmed: ["active", "cancelled"],
  active: ["completed", "cancelled"],
  completed: ["archived"],
  cancelled: ["archived"],
  archived: []
} as const;

export interface ProjectFinancials {
  budget: number;
  actual_cost: number;
  revenue: number;
  currency: string;
  rates: {
    equipment: EquipmentRate[];
    crew: Record<CrewRole, number>;
  };
  invoice_status: "draft" | "pending" | "sent" | "paid";
}

export interface ProjectTimeline {
  setup_start: Date;
  event_start: Date;
  event_end: Date;
  strike_end: Date;
}

export interface ProjectResources {
  crew: {
    role: CrewRole;
    assigned_member_id?: string;
    required_count: number;
  }[];
  equipment: {
    equipment_id: string;
    quantity: number;
    backup_equipment_ids?: string[];
  }[];
}

export interface ProjectWithDetails extends Project {
  timeline: ProjectTimeline;
  resources: ProjectResources;
  financials: ProjectFinancials;
  status: ProjectStatus;
}

// Validation types
export type ProjectStatusTransition = {
  from: ProjectStatus;
  to: ProjectStatus;
  validation: (project: ProjectWithDetails) => boolean;
};

export const PROJECT_VALIDATIONS: ProjectStatusTransition[] = [
  {
    from: "draft",
    to: "pending",
    validation: (project) => {
      return (
        !!project.timeline &&
        project.resources.crew.length > 0 &&
        project.resources.equipment.length > 0
      );
    }
  },
  {
    from: "pending",
    to: "confirmed",
    validation: (project) => {
      return (
        project.resources.crew.every((role) => role.assigned_member_id) &&
        !!project.financials.budget
      );
    }
  }
];

export interface ProjectData extends Project {
  customer?: {
    id: string;
    name: string;
  } | null;
  crew_member?: {
    id: string;
    name: string;
  } | null;
}