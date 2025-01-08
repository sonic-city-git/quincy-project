import { CrewMember, CrewMemberInsert, CrewMemberUpdate } from './crew';
import { Customer, CustomerInsert, CustomerUpdate } from './customer';
import { Equipment, EquipmentInsert, EquipmentUpdate, EquipmentSerialNumber } from './equipment';
import { EventType, EventTypeInsert, EventTypeUpdate, ProjectEvent, ProjectEventInsert, ProjectEventUpdate } from './event';
import { Folder, FolderInsert, FolderUpdate } from './folder';
import { Project, ProjectInsert, ProjectUpdate } from './project';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      crew_members: {
        Row: CrewMember;
        Insert: CrewMemberInsert;
        Update: CrewMemberUpdate;
      };
      customers: {
        Row: Customer;
        Insert: CustomerInsert;
        Update: CustomerUpdate;
      };
      equipment: {
        Row: Equipment;
        Insert: EquipmentInsert;
        Update: EquipmentUpdate;
      };
      equipment_serial_numbers: {
        Row: EquipmentSerialNumber;
        Insert: Omit<EquipmentSerialNumber, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<EquipmentSerialNumber, 'id' | 'created_at' | 'updated_at'>>;
      };
      event_types: {
        Row: EventType;
        Insert: EventTypeInsert;
        Update: EventTypeUpdate;
      };
      folders: {
        Row: Folder;
        Insert: FolderInsert;
        Update: FolderUpdate;
      };
      project_events: {
        Row: ProjectEvent;
        Insert: ProjectEventInsert;
        Update: ProjectEventUpdate;
      };
      projects: {
        Row: Project;
        Insert: ProjectInsert;
        Update: ProjectUpdate;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Insertable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updatable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];