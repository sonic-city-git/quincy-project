import { CrewMember } from "@/types/crew";
import { Equipment } from "@/types/equipment";

export enum ResourceType {
  CREW = 'crew',
  EQUIPMENT = 'equipment'
}

export interface BaseResource {
  id: string;
  name: string;
  type: ResourceType;
  created_at: string;
  updated_at: string;
}

export interface ResourceCrew extends BaseResource {
  type: ResourceType.CREW;
  original: CrewMember;
  avatar_url?: string;
  roles: string[];
}

export interface ResourceEquipment extends BaseResource {
  type: ResourceType.EQUIPMENT;
  original: Equipment;
  folder_id: string;
  stock: number;
  rate_hourly?: number;
  rate_daily?: number;
}

export type Resource = ResourceCrew | ResourceEquipment;

export function isCrewResource(resource: Resource): resource is ResourceCrew {
  return resource.type === ResourceType.CREW;
}

export function isEquipmentResource(resource: Resource): resource is ResourceEquipment {
  return resource.type === ResourceType.EQUIPMENT;
}