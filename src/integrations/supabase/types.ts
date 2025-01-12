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
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          project_id?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          project_id?: string | null
          sort_order?: number | null
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
          hourly_rate: number | null
          hours_worked: number | null
          id: string
          project_id: string | null
          role_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          crew_member_id?: string | null
          daily_rate?: number | null
          event_id?: string | null
          hourly_rate?: number | null
          hours_worked?: number | null
          id?: string
          project_id?: string | null
          role_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          crew_member_id?: string | null
          daily_rate?: number | null
          event_id?: string | null
          hourly_rate?: number | null
          hours_worked?: number | null
          id?: string
          project_id?: string | null
          role_id?: string | null
          updated_at?: string
        }
        Relationships: [
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
        ]
      }
      project_events: {
        Row: {
          created_at: string
          date: string
          event_type_id: string | null
          id: string
          location: string | null
          name: string
          project_id: string | null
          revenue: number | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          event_type_id?: string | null
          id?: string
          location?: string | null
          name: string
          project_id?: string | null
          revenue?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          event_type_id?: string | null
          id?: string
          location?: string | null
          name?: string
          project_id?: string | null
          revenue?: number | null
          status?: string
          updated_at?: string
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
        ]
      }
      project_roles: {
        Row: {
          created_at: string
          daily_rate: number | null
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
          hourly_rate?: number | null
          id?: string
          preferred_id?: string | null
          project_id?: string | null
          role_id?: string | null
          updated_at?: string
        }
        Relationships: [
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
      projects: {
        Row: {
          color: string | null
          created_at: string
          customer_id: string | null
          id: string
          name: string
          owner_id: string | null
          project_number: number
          to_be_invoiced: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          name: string
          owner_id?: string | null
          project_number?: number
          to_be_invoiced?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          project_number?: number
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
      sync_all_avatars: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
