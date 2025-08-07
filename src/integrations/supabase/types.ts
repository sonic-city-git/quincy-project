export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      crew_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      crew_member_roles: {
        Row: {
          created_at: string
          crew_member_id: string | null
          id: string
          role_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          crew_member_id?: string | null
          id?: string
          role_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          crew_member_id?: string | null
          id?: string
          role_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      crew_members: {
        Row: {
          auth_id: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          folder_id: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          auth_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          folder_id?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          auth_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          folder_id?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crew_members_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "crew_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_roles: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          customer_number: string | null
          email: string | null
          id: string
          name: string
          organization_number: string | null
          phone_number: string | null
          tripletex_id: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_number?: string | null
          email?: string | null
          id?: string
          name: string
          organization_number?: string | null
          phone_number?: string | null
          tripletex_id?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_number?: string | null
          email?: string | null
          id?: string
          name?: string
          organization_number?: string | null
          phone_number?: string | null
          tripletex_id?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      development_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          is_active: boolean | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          is_active?: boolean | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      equipment: {
        Row: {
          code: string | null
          created_at: string
          folder_id: string | null
          id: string
          internal_remark: string | null
          name: string
          rental_price: number | null
          stock: number | null
          stock_calculation: string | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          folder_id?: string | null
          id?: string
          internal_remark?: string | null
          name: string
          rental_price?: number | null
          stock?: number | null
          stock_calculation?: string | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          code?: string | null
          created_at?: string
          folder_id?: string | null
          id?: string
          internal_remark?: string | null
          name?: string
          rental_price?: number | null
          stock?: number | null
          stock_calculation?: string | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "equipment_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "equipment_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_groups: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      equipment_repairs: {
        Row: {
          can_be_used: boolean | null
          created_at: string
          description: string
          end_date: string | null
          equipment_id: string | null
          id: string
          quantity: number | null
          serial_numbers: string[] | null
          start_date: string
          status: string | null
          updated_at: string
        }
        Insert: {
          can_be_used?: boolean | null
          created_at?: string
          description: string
          end_date?: string | null
          equipment_id?: string | null
          id?: string
          quantity?: number | null
          serial_numbers?: string[] | null
          start_date?: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          can_be_used?: boolean | null
          created_at?: string
          description?: string
          end_date?: string | null
          equipment_id?: string | null
          id?: string
          quantity?: number | null
          serial_numbers?: string[] | null
          start_date?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_repairs_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_serial_numbers: {
        Row: {
          created_at: string
          equipment_id: string | null
          id: string
          notes: string | null
          serial_number: string
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          equipment_id?: string | null
          id?: string
          notes?: string | null
          serial_number: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          equipment_id?: string | null
          id?: string
          notes?: string | null
          serial_number?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_serial_numbers_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      event_types: {
        Row: {
          allows_discount: boolean | null
          color: string
          created_at: string
          crew_rate_multiplier: number | null
          equipment_rate_multiplier: number | null
          id: string
          name: string
          needs_crew: boolean | null
          needs_equipment: boolean | null
          rate_type: string | null
          updated_at: string
        }
        Insert: {
          allows_discount?: boolean | null
          color: string
          created_at?: string
          crew_rate_multiplier?: number | null
          equipment_rate_multiplier?: number | null
          id?: string
          name: string
          needs_crew?: boolean | null
          needs_equipment?: boolean | null
          rate_type?: string | null
          updated_at?: string
        }
        Update: {
          allows_discount?: boolean | null
          color?: string
          created_at?: string
          crew_rate_multiplier?: number | null
          equipment_rate_multiplier?: number | null
          id?: string
          name?: string
          needs_crew?: boolean | null
          needs_equipment?: boolean | null
          rate_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      hourly_rate_settings: {
        Row: {
          category: Database["public"]["Enums"]["hourly_rate_category"]
          created_at: string
          double_time_multiplier: number | null
          double_time_threshold: number | null
          id: string
          overtime_multiplier: number | null
          overtime_threshold: number | null
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["hourly_rate_category"]
          created_at?: string
          double_time_multiplier?: number | null
          double_time_threshold?: number | null
          id?: string
          overtime_multiplier?: number | null
          overtime_threshold?: number | null
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["hourly_rate_category"]
          created_at?: string
          double_time_multiplier?: number | null
          double_time_threshold?: number | null
          id?: string
          overtime_multiplier?: number | null
          overtime_threshold?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      project_crew: {
        Row: {
          created_at: string
          crew_member_id: string | null
          id: string
          notes: string | null
          project_id: string | null
          role_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          crew_member_id?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          role_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          crew_member_id?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          role_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_crew_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_equipment: {
        Row: {
          created_at: string
          equipment_id: string | null
          group_id: string | null
          id: string
          notes: string | null
          project_id: string | null
          quantity: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          equipment_id?: string | null
          group_id?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          quantity?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          equipment_id?: string | null
          group_id?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          quantity?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_equipment_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "project_equipment_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_equipment_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_equipment_groups: {
        Row: {
          created_at: string
          id: string
          name: string
          project_id: string | null
          sort_order: number | null
          total_price: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          project_id?: string | null
          sort_order?: number | null
          total_price?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          project_id?: string | null
          sort_order?: number | null
          total_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_equipment_groups_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_event_equipment: {
        Row: {
          created_at: string
          equipment_id: string | null
          event_id: string | null
          group_id: string | null
          id: string
          is_synced: boolean | null
          notes: string | null
          project_id: string | null
          quantity: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          equipment_id?: string | null
          event_id?: string | null
          group_id?: string | null
          id?: string
          is_synced?: boolean | null
          notes?: string | null
          project_id?: string | null
          quantity?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          equipment_id?: string | null
          event_id?: string | null
          group_id?: string | null
          id?: string
          is_synced?: boolean | null
          notes?: string | null
          project_id?: string | null
          quantity?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_event_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_event_equipment_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "project_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_event_equipment_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "project_equipment_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_event_equipment_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_event_roles: {
        Row: {
          created_at: string
          crew_member_id: string | null
          daily_rate: number | null
          event_id: string | null
          hourly_category:
            | Database["public"]["Enums"]["hourly_rate_category"]
            | null
          hourly_rate: number | null
          hours_worked: number | null
          id: string
          project_id: string | null
          role_id: string | null
          total_cost: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          crew_member_id?: string | null
          daily_rate?: number | null
          event_id?: string | null
          hourly_category?:
            | Database["public"]["Enums"]["hourly_rate_category"]
            | null
          hourly_rate?: number | null
          hours_worked?: number | null
          id?: string
          project_id?: string | null
          role_id?: string | null
          total_cost?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          crew_member_id?: string | null
          daily_rate?: number | null
          event_id?: string | null
          hourly_category?:
            | Database["public"]["Enums"]["hourly_rate_category"]
            | null
          hourly_rate?: number | null
          hours_worked?: number | null
          id?: string
          project_id?: string | null
          role_id?: string | null
          total_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_event_roles_crew_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_event_roles_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "project_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_event_roles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_event_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "crew_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_events: {
        Row: {
          created_at: string
          crew_price: number | null
          date: string
          equipment_price: number | null
          event_type_id: string | null
          id: string
          location: string
          location_data: Json | null
          name: string
          project_id: string | null
          status: string
          total_price: number | null
          updated_at: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          crew_price?: number | null
          date: string
          equipment_price?: number | null
          event_type_id?: string | null
          id?: string
          location: string
          location_data?: Json | null
          name: string
          project_id?: string | null
          status?: string
          total_price?: number | null
          updated_at?: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          crew_price?: number | null
          date?: string
          equipment_price?: number | null
          event_type_id?: string | null
          id?: string
          location?: string
          location_data?: Json | null
          name?: string
          project_id?: string | null
          status?: string
          total_price?: number | null
          updated_at?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_events_event_type_id_fkey"
            columns: ["event_type_id"]
            isOneToOne: false
            referencedRelation: "event_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_events_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "project_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      project_roles: {
        Row: {
          created_at: string
          daily_rate: number | null
          hourly_category:
            | Database["public"]["Enums"]["hourly_rate_category"]
            | null
          hourly_rate: number | null
          id: string
          preferred_id: string | null
          project_id: string | null
          role_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_rate?: number | null
          hourly_category?:
            | Database["public"]["Enums"]["hourly_rate_category"]
            | null
          hourly_rate?: number | null
          id?: string
          preferred_id?: string | null
          project_id?: string | null
          role_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_rate?: number | null
          hourly_category?:
            | Database["public"]["Enums"]["hourly_rate_category"]
            | null
          hourly_rate?: number | null
          id?: string
          preferred_id?: string | null
          project_id?: string | null
          role_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_roles_preferred_id_fkey"
            columns: ["preferred_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_roles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "crew_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_types: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          price_multiplier: number | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          price_multiplier?: number | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          price_multiplier?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          color: string | null
          created_at: string
          customer_id: string | null
          id: string
          is_archived: boolean | null
          name: string
          owner_id: string | null
          project_number: number
          project_type_id: string | null
          to_be_invoiced: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          is_archived?: boolean | null
          name: string
          owner_id?: string | null
          project_number?: number
          project_type_id?: string | null
          to_be_invoiced?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          is_archived?: boolean | null
          name?: string
          owner_id?: string | null
          project_number?: number
          project_type_id?: string | null
          to_be_invoiced?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_project_type_id_fkey"
            columns: ["project_type_id"]
            isOneToOne: false
            referencedRelation: "project_types"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_events: {
        Row: {
          created_at: string
          date: string
          id: string
          status: Database["public"]["Enums"]["event_status"]
          total_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          status?: Database["public"]["Enums"]["event_status"]
          total_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          status?: Database["public"]["Enums"]["event_status"]
          total_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      sync_operations: {
        Row: {
          attempts: number | null
          created_at: string | null
          error_message: string | null
          event_id: string | null
          id: string
          project_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          event_id?: string | null
          id?: string
          project_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          event_id?: string | null
          id?: string
          project_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sync_operations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "project_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_operations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      temp_equipment: {
        Row: {
          code: string | null
          created: string | null
          equipment_folder: string | null
          internal_remark: string | null
          name: string | null
          rental_price: number | null
          serial_number: string | null
          stock: number | null
          stock_calculation: string | null
          weight: number | null
        }
        Insert: {
          code?: string | null
          created?: string | null
          equipment_folder?: string | null
          internal_remark?: string | null
          name?: string | null
          rental_price?: number | null
          serial_number?: string | null
          stock?: number | null
          stock_calculation?: string | null
          weight?: number | null
        }
        Update: {
          code?: string | null
          created?: string | null
          equipment_folder?: string | null
          internal_remark?: string | null
          name?: string | null
          rental_price?: number | null
          serial_number?: string | null
          stock?: number | null
          stock_calculation?: string | null
          weight?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_hourly_cost: {
        Args:
          | {
              p_hours: number
              p_hourly_rate: number
              p_category: Database["public"]["Enums"]["hourly_rate_category"]
            }
          | {
              p_hours: number
              p_hourly_rate: number
              p_category: Database["public"]["Enums"]["hourly_rate_category"]
              p_is_artist?: boolean
              p_is_hours_event?: boolean
            }
        Returns: number
      }
      sync_all_avatars: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      sync_event_crew: {
        Args: { p_event_id: string; p_project_id: string }
        Returns: undefined
      }
      sync_event_equipment: {
        Args: { p_event_id: string; p_project_id: string }
        Returns: undefined
      }
      update_group_sort_orders: {
        Args: {
          p_project_id: string
          p_source_group_id: string
          p_target_sort_order: number
          p_direction: number
        }
        Returns: undefined
      }
    }
    Enums: {
      event_status: "proposed" | "confirmed" | "cancelled"
      hourly_rate_category: "flat" | "corporate" | "broadcast"
      project_type: "artist" | "corporate" | "broadcast" | "dry_hire"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      event_status: ["proposed", "confirmed", "cancelled"],
      hourly_rate_category: ["flat", "corporate", "broadcast"],
      project_type: ["artist", "corporate", "broadcast", "dry_hire"],
    },
  },
} as const
