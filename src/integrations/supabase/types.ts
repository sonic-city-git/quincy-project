export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
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
          variant_id: string | null
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
          variant_id?: string | null
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
          variant_id?: string | null
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
          {
            foreignKeyName: "project_equipment_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "project_variants"
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
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          project_id?: string | null
          sort_order?: number | null
          total_price?: number | null
          updated_at?: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          project_id?: string | null
          sort_order?: number | null
          total_price?: number | null
          updated_at?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_equipment_groups_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_equipment_groups_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "project_variants"
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
          variant_id: string | null
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
          variant_id?: string | null
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
          variant_id?: string | null
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
          {
            foreignKeyName: "project_event_equipment_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "project_variants"
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
          variant_id: string | null
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
          variant_id?: string | null
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
          variant_id?: string | null
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
          {
            foreignKeyName: "project_event_roles_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "project_variants"
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
          location: string | null
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
          location?: string | null
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
          location?: string | null
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
          variant_id: string | null
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
          variant_id?: string | null
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
          variant_id?: string | null
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
          {
            foreignKeyName: "project_roles_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "project_variants"
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
      project_variants: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          project_id: string
          sort_order: number | null
          updated_at: string | null
          variant_name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          project_id: string
          sort_order?: number | null
          updated_at?: string | null
          variant_name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          project_id?: string
          sort_order?: number | null
          updated_at?: string | null
          variant_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_variants_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
      variant_statistics: {
        Row: {
          default_variants: number | null
          project_type: string | null
          projects_with_variants: number | null
          total_projects: number | null
          total_variants: number | null
        }
        Relationships: []
      }
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
        Args:
          | { p_event_id: string; p_project_id: string }
          | {
              p_event_id: string
              p_project_id: string
              p_variant_name?: string
            }
        Returns: undefined
      }
      sync_event_equipment: {
        Args: { p_event_id: string; p_project_id: string }
        Returns: undefined
      }
      sync_event_equipment_unified: {
        Args:
          | { p_event_id: string; p_project_id: string }
          | {
              p_event_id: string
              p_project_id: string
              p_variant_name?: string
            }
        Returns: undefined
      }
      sync_event_variant: {
        Args: {
          p_event_id: string
          p_project_id: string
          p_variant_name?: string
        }
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
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: { bucketid: string; name: string; owner: string; metadata: Json }
        Returns: undefined
      }
      extension: {
        Args: { name: string }
        Returns: string
      }
      filename: {
        Args: { name: string }
        Returns: string
      }
      foldername: {
        Args: { name: string }
        Returns: string[]
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          size: number
          bucket_id: string
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          prefix_param: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
        }
        Returns: {
          key: string
          id: string
          created_at: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string
          prefix_param: string
          delimiter_param: string
          max_keys?: number
          start_after?: string
          next_token?: string
        }
        Returns: {
          name: string
          id: string
          metadata: Json
          updated_at: string
        }[]
      }
      operation: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      event_status: ["proposed", "confirmed", "cancelled"],
      hourly_rate_category: ["flat", "corporate", "broadcast"],
      project_type: ["artist", "corporate", "broadcast", "dry_hire"],
    },
  },
  storage: {
    Enums: {},
  },
} as const
