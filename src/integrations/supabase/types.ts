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
      crew_members: {
        Row: {
          created_at: string
          email: string
          folder: string
          id: string
          name: string
          phone: string
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          folder: string
          id?: string
          name: string
          phone: string
          role: string
        }
        Update: {
          created_at?: string
          email?: string
          folder?: string
          id?: string
          name?: string
          phone?: string
          role?: string
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
          tripletex_id: number
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
          tripletex_id: number
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
          tripletex_id?: number
          updated_at?: string
        }
        Relationships: []
      }
      equipment: {
        Row: {
          "Book Value": number | null
          Code: string | null
          "Created on": string | null
          "External remark": string | null
          Folder: string | null
          folder_id: string | null
          id: string
          "Internal remark": string | null
          Name: string | null
          Price: number | null
          "Rental/sales": string | null
          "Serial number": string | null
          "Serial number remark": string | null
          Stock: number | null
          "Stock calculation method": string | null
          Weight: number | null
        }
        Insert: {
          "Book Value"?: number | null
          Code?: string | null
          "Created on"?: string | null
          "External remark"?: string | null
          Folder?: string | null
          folder_id?: string | null
          id?: string
          "Internal remark"?: string | null
          Name?: string | null
          Price?: number | null
          "Rental/sales"?: string | null
          "Serial number"?: string | null
          "Serial number remark"?: string | null
          Stock?: number | null
          "Stock calculation method"?: string | null
          Weight?: number | null
        }
        Update: {
          "Book Value"?: number | null
          Code?: string | null
          "Created on"?: string | null
          "External remark"?: string | null
          Folder?: string | null
          folder_id?: string | null
          id?: string
          "Internal remark"?: string | null
          Name?: string | null
          Price?: number | null
          "Rental/sales"?: string | null
          "Serial number"?: string | null
          "Serial number remark"?: string | null
          Stock?: number | null
          "Stock calculation method"?: string | null
          Weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      event_types: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          color: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      folders: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      project_events: {
        Row: {
          created_at: string
          date: string
          event_type_id: string
          id: string
          name: string
          project_id: string
        }
        Insert: {
          created_at?: string
          date: string
          event_type_id: string
          id?: string
          name: string
          project_id: string
        }
        Update: {
          created_at?: string
          date?: string
          event_type_id?: string
          id?: string
          name?: string
          project_id?: string
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
      projects: {
        Row: {
          color: string
          created_at: string
          customer: string | null
          gig_price: string | null
          id: string
          last_invoiced: string | null
          name: string
          owner_id: string
          yearly_revenue: string | null
        }
        Insert: {
          color: string
          created_at?: string
          customer?: string | null
          gig_price?: string | null
          id?: string
          last_invoiced?: string | null
          name: string
          owner_id: string
          yearly_revenue?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          customer?: string | null
          gig_price?: string | null
          id?: string
          last_invoiced?: string | null
          name?: string
          owner_id?: string
          yearly_revenue?: string | null
        }
        Relationships: [
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
