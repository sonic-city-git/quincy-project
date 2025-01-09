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
      crew_member_roles: {
        Row: {
          crew_member_id: string
          role_id: string
        }
        Insert: {
          crew_member_id: string
          role_id: string
        }
        Update: {
          crew_member_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crew_member_roles_crew_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_member_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "crew_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_members: {
        Row: {
          created_at: string
          email: string
          folder_id: string | null
          id: string
          metadata: Json | null
          name: string
          phone: string
        }
        Insert: {
          created_at?: string
          email: string
          folder_id?: string | null
          id?: string
          metadata?: Json | null
          name: string
          phone: string
        }
        Update: {
          created_at?: string
          email?: string
          folder_id?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "crew_members_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "equipment_folders"
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
          sort_order: number | null
        }
        Insert: {
          color: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          metadata: Json | null
          name: string
          organization_number: string | null
          phone: string | null
          tripletex_id: number | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          metadata?: Json | null
          name: string
          organization_number?: string | null
          phone?: string | null
          tripletex_id?: number | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          organization_number?: string | null
          phone?: string | null
          tripletex_id?: number | null
        }
        Relationships: []
      }
      equipment: {
        Row: {
          category_id: string | null
          code: string | null
          created_at: string
          daily_rate: number | null
          folder_id: string | null
          id: string
          manual_stock: number | null
          metadata: Json | null
          name: string
          stock_type: string | null
        }
        Insert: {
          category_id?: string | null
          code?: string | null
          created_at?: string
          daily_rate?: number | null
          folder_id?: string | null
          id?: string
          manual_stock?: number | null
          metadata?: Json | null
          name: string
          stock_type?: string | null
        }
        Update: {
          category_id?: string | null
          code?: string | null
          created_at?: string
          daily_rate?: number | null
          folder_id?: string | null
          id?: string
          manual_stock?: number | null
          metadata?: Json | null
          name?: string
          stock_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "equipment_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "equipment_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "equipment_categories"
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
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "equipment_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_serial_numbers: {
        Row: {
          created_at: string
          equipment_id: string | null
          id: string
          metadata: Json | null
          serial_number: string
          status: string | null
        }
        Insert: {
          created_at?: string
          equipment_id?: string | null
          id?: string
          metadata?: Json | null
          serial_number: string
          status?: string | null
        }
        Update: {
          created_at?: string
          equipment_id?: string | null
          id?: string
          metadata?: Json | null
          serial_number?: string
          status?: string | null
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
        }
        Relationships: []
      }
      maintenance_tickets: {
        Row: {
          affects_availability: boolean | null
          created_at: string
          description: string
          end_date: string | null
          equipment_id: string | null
          id: string
          metadata: Json | null
          reported_by_id: string | null
          start_date: string
          status: string | null
        }
        Insert: {
          affects_availability?: boolean | null
          created_at?: string
          description: string
          end_date?: string | null
          equipment_id?: string | null
          id?: string
          metadata?: Json | null
          reported_by_id?: string | null
          start_date: string
          status?: string | null
        }
        Update: {
          affects_availability?: boolean | null
          created_at?: string
          description?: string
          end_date?: string | null
          equipment_id?: string | null
          id?: string
          metadata?: Json | null
          reported_by_id?: string | null
          start_date?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_tickets_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_tickets_reported_by_id_fkey"
            columns: ["reported_by_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
        ]
      }
      project_equipment: {
        Row: {
          category_id: string | null
          created_at: string
          daily_rate: number | null
          equipment_id: string | null
          id: string
          project_id: string | null
          quantity: number | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          daily_rate?: number | null
          equipment_id?: string | null
          id?: string
          project_id?: string | null
          quantity?: number | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          daily_rate?: number | null
          equipment_id?: string | null
          id?: string
          project_id?: string | null
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_equipment_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "equipment_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
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
      project_event_equipment: {
        Row: {
          created_at: string
          id: string
          project_equipment_id: string | null
          project_event_id: string | null
          quantity: number | null
          rate_override: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          project_equipment_id?: string | null
          project_event_id?: string | null
          quantity?: number | null
          rate_override?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          project_equipment_id?: string | null
          project_event_id?: string | null
          quantity?: number | null
          rate_override?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_event_equipment_project_equipment_id_fkey"
            columns: ["project_equipment_id"]
            isOneToOne: false
            referencedRelation: "project_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_event_equipment_project_event_id_fkey"
            columns: ["project_event_id"]
            isOneToOne: false
            referencedRelation: "project_events"
            referencedColumns: ["id"]
          },
        ]
      }
      project_event_roles: {
        Row: {
          assigned_crew_id: string | null
          created_at: string
          hours_worked: number | null
          id: string
          project_event_id: string | null
          project_role_id: string | null
          rate_override: number | null
        }
        Insert: {
          assigned_crew_id?: string | null
          created_at?: string
          hours_worked?: number | null
          id?: string
          project_event_id?: string | null
          project_role_id?: string | null
          rate_override?: number | null
        }
        Update: {
          assigned_crew_id?: string | null
          created_at?: string
          hours_worked?: number | null
          id?: string
          project_event_id?: string | null
          project_role_id?: string | null
          rate_override?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_event_roles_assigned_crew_id_fkey"
            columns: ["assigned_crew_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_event_roles_project_event_id_fkey"
            columns: ["project_event_id"]
            isOneToOne: false
            referencedRelation: "project_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_event_roles_project_role_id_fkey"
            columns: ["project_role_id"]
            isOneToOne: false
            referencedRelation: "project_roles"
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
          metadata: Json | null
          name: string
          project_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          date: string
          event_type_id?: string | null
          id?: string
          metadata?: Json | null
          name: string
          project_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          event_type_id?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          project_id?: string | null
          status?: string | null
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
          daily_rate: number
          hourly_rate: number | null
          id: string
          preferred_crew_id: string | null
          project_id: string | null
          role_id: string | null
        }
        Insert: {
          created_at?: string
          daily_rate: number
          hourly_rate?: number | null
          id?: string
          preferred_crew_id?: string | null
          project_id?: string | null
          role_id?: string | null
        }
        Update: {
          created_at?: string
          daily_rate?: number
          hourly_rate?: number | null
          id?: string
          preferred_crew_id?: string | null
          project_id?: string | null
          role_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_roles_preferred_crew_id_fkey"
            columns: ["preferred_crew_id"]
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
      projects: {
        Row: {
          color: string
          created_at: string
          customer_id: string | null
          id: string
          metadata: Json | null
          name: string
          owner_id: string
          status: string | null
        }
        Insert: {
          color: string
          created_at?: string
          customer_id?: string | null
          id?: string
          metadata?: Json | null
          name: string
          owner_id: string
          status?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          customer_id?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          owner_id?: string
          status?: string | null
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
      salary_rules: {
        Row: {
          created_at: string
          crew_profit_deduction: number
          folder_id: string | null
          id: string
          project_profit_deduction: number | null
          social_costs_rate: number
        }
        Insert: {
          created_at?: string
          crew_profit_deduction: number
          folder_id?: string | null
          id?: string
          project_profit_deduction?: number | null
          social_costs_rate: number
        }
        Update: {
          created_at?: string
          crew_profit_deduction?: number
          folder_id?: string | null
          id?: string
          project_profit_deduction?: number | null
          social_costs_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "salary_rules_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "equipment_folders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
