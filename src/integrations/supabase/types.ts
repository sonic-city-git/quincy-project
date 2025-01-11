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
          created_at: string
          email: string | null
          folder_id: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          folder_id?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
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
      equipment: {
        Row: {
          barcode: string | null
          brand: string | null
          code: string | null
          created_at: string
          description: string | null
          folder_id: string | null
          id: string
          model: string | null
          name: string
          notes: string | null
          power_requirements: string | null
          serial_number: string | null
          status: string | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          code?: string | null
          created_at?: string
          description?: string | null
          folder_id?: string | null
          id?: string
          model?: string | null
          name: string
          notes?: string | null
          power_requirements?: string | null
          serial_number?: string | null
          status?: string | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          code?: string | null
          created_at?: string
          description?: string | null
          folder_id?: string | null
          id?: string
          model?: string | null
          name?: string
          notes?: string | null
          power_requirements?: string | null
          serial_number?: string | null
          status?: string | null
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
      equipment_maintenance: {
        Row: {
          cost: number | null
          created_at: string
          description: string
          equipment_id: string | null
          id: string
          maintenance_date: string
          notes: string | null
          performed_by: string | null
          updated_at: string
        }
        Insert: {
          cost?: number | null
          created_at?: string
          description: string
          equipment_id?: string | null
          id?: string
          maintenance_date: string
          notes?: string | null
          performed_by?: string | null
          updated_at?: string
        }
        Update: {
          cost?: number | null
          created_at?: string
          description?: string
          equipment_id?: string | null
          id?: string
          maintenance_date?: string
          notes?: string | null
          performed_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_maintenance_equipment_id_fkey"
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
          color: string
          created_at: string
          crew_rate_multiplier: number | null
          id: string
          name: string
          needs_crew: boolean | null
          updated_at: string
        }
        Insert: {
          color: string
          created_at?: string
          crew_rate_multiplier?: number | null
          id?: string
          name: string
          needs_crew?: boolean | null
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          crew_rate_multiplier?: number | null
          id?: string
          name?: string
          needs_crew?: boolean | null
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
          id: string
          notes: string | null
          project_id: string | null
          quantity: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          equipment_id?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          quantity?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          equipment_id?: string | null
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
            foreignKeyName: "project_equipment_project_id_fkey"
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
          name: string
          project_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          event_type_id?: string | null
          id?: string
          name: string
          project_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          event_type_id?: string | null
          id?: string
          name?: string
          project_id?: string | null
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
        ]
      }
      projects: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          name: string
          owner_id: string | null
          project_number: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          name: string
          owner_id?: string | null
          project_number?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          project_number?: number
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
