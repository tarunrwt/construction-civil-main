export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      daily_reports: {
        Row: {
          cost: number | null
          created_at: string | null
          id: string
          machinery: string | null
          manpower: number | null
          materials_used: string | null
          project_id: string | null
          remarks: string | null
          report_date: string
          safety_incidents: string | null
          stage: string | null
          weather: string | null
          work_completed: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          id?: string
          machinery?: string | null
          manpower?: number | null
          materials_used?: string | null
          project_id?: string | null
          remarks?: string | null
          report_date: string
          safety_incidents?: string | null
          stage?: string | null
          weather?: string | null
          work_completed?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          id?: string
          machinery?: string | null
          manpower?: number | null
          materials_used?: string | null
          project_id?: string | null
          remarks?: string | null
          report_date?: string
          safety_incidents?: string | null
          stage?: string | null
          weather?: string | null
          work_completed?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      dpr_costs_incurred: {
        Row: {
          amount_spent_today: number | null
          cost_category: string | null
          dpr_id: number | null
          id: number
        }
        Insert: {
          amount_spent_today?: number | null
          cost_category?: string | null
          dpr_id?: number | null
          id?: number
        }
        Update: {
          amount_spent_today?: number | null
          cost_category?: string | null
          dpr_id?: number | null
          id?: number
        }
        Relationships: []
      }
      dpr_labor_attendance: {
        Row: {
          dpr_id: number | null
          id: number
          worker_count_today: number | null
        }
        Insert: {
          dpr_id?: number | null
          id?: number
          worker_count_today?: number | null
        }
        Update: {
          dpr_id?: number | null
          id?: number
          worker_count_today?: number | null
        }
        Relationships: []
      }
      dpr_material_usage: {
        Row: {
          dpr_id: number | null
          id: number
          material_name: string | null
          quantity_used: number | null
        }
        Insert: {
          dpr_id?: number | null
          id?: number
          material_name?: string | null
          quantity_used?: number | null
        }
        Update: {
          dpr_id?: number | null
          id?: number
          material_name?: string | null
          quantity_used?: number | null
        }
        Relationships: []
      }
      dpr_work_progress: {
        Row: {
          dpr_id: number | null
          id: number
          quantity_done_today: number | null
          work_item_id: number | null
        }
        Insert: {
          dpr_id?: number | null
          id?: number
          quantity_done_today?: number | null
          work_item_id?: number | null
        }
        Update: {
          dpr_id?: number | null
          id?: number
          quantity_done_today?: number | null
          work_item_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dpr_work_progress_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["work_item_id"]
          },
        ]
      }
      issues_snags: {
        Row: {
          description: string | null
          dpr_id: number | null
          id: number
          severity: string | null
        }
        Insert: {
          description?: string | null
          dpr_id?: number | null
          id?: number
          severity?: string | null
        }
        Update: {
          description?: string | null
          dpr_id?: number | null
          id?: number
          severity?: string | null
        }
        Relationships: []
      }
      labor_types: {
        Row: {
          labor_type_id: number
          role_name: string
        }
        Insert: {
          labor_type_id?: number
          role_name: string
        }
        Update: {
          labor_type_id?: number
          role_name?: string
        }
        Relationships: []
      }
      materials: {
        Row: {
          cost_per_unit: number | null
          created_at: string
          id: number
          name: string
          project_id: number | null
          quantity_needed: number | null
          quantity_on_hand: number | null
          supplier: string | null
          user_id: string | null
        }
        Insert: {
          cost_per_unit?: number | null
          created_at?: string
          id?: never
          name: string
          project_id?: number | null
          quantity_needed?: number | null
          quantity_on_hand?: number | null
          supplier?: string | null
          user_id?: string | null
        }
        Update: {
          cost_per_unit?: number | null
          created_at?: string
          id?: never
          name?: string
          project_id?: number | null
          quantity_needed?: number | null
          quantity_on_hand?: number | null
          supplier?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      materials_master: {
        Row: {
          material_id: number
          material_name: string
          unit: string
        }
        Insert: {
          material_id?: number
          material_name: string
          unit: string
        }
        Update: {
          material_id?: number
          material_name?: string
          unit?: string
        }
        Relationships: []
      }
      personnel: {
        Row: {
          contact_info: string | null
          id: number
          name: string
          role: string | null
          user_id: string | null
        }
        Insert: {
          contact_info?: string | null
          id?: never
          name: string
          role?: string | null
          user_id?: string | null
        }
        Update: {
          contact_info?: string | null
          id?: never
          name?: string
          role?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      project_materials_budget: {
        Row: {
          material_id: number | null
          planned_total_cost: number | null
          planned_total_quantity: number
          project_id: number | null
          project_material_id: number
        }
        Insert: {
          material_id?: number | null
          planned_total_cost?: number | null
          planned_total_quantity: number
          project_id?: number | null
          project_material_id?: number
        }
        Update: {
          material_id?: number | null
          planned_total_cost?: number | null
          planned_total_quantity?: number
          project_id?: number | null
          project_material_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_materials_budget_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials_master"
            referencedColumns: ["material_id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          id: string
          name: string
          start_date: string | null
          total_cost: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          start_date?: string | null
          total_cost?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          start_date?: string | null
          total_cost?: number | null
        }
        Relationships: []
      }
      stages_master: {
        Row: {
          stage_id: number
          stage_name: string
          stage_order: number
        }
        Insert: {
          stage_id?: number
          stage_name: string
          stage_order: number
        }
        Update: {
          stage_id?: number
          stage_name?: string
          stage_order?: number
        }
        Relationships: []
      }
      tasks: {
        Row: {
          actual_end_date: string | null
          assigned_to: number | null
          created_at: string
          description: string | null
          due_date: string | null
          id: number
          name: string
          priority: string | null
          progress: number | null
          project_id: number | null
          start_date: string | null
          status: string | null
          target_end_date: string | null
          user_id: string | null
        }
        Insert: {
          actual_end_date?: string | null
          assigned_to?: number | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: never
          name: string
          priority?: string | null
          progress?: number | null
          project_id?: number | null
          start_date?: string | null
          status?: string | null
          target_end_date?: string | null
          user_id?: string | null
        }
        Update: {
          actual_end_date?: string | null
          assigned_to?: number | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: never
          name?: string
          priority?: string | null
          progress?: number | null
          project_id?: number | null
          start_date?: string | null
          status?: string | null
          target_end_date?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
        ]
      }
      work_items: {
        Row: {
          item_name: string | null
          planned_quantity: number | null
          project_stage_id: number | null
          work_item_id: number
        }
        Insert: {
          item_name?: string | null
          planned_quantity?: number | null
          project_stage_id?: number | null
          work_item_id?: number
        }
        Update: {
          item_name?: string | null
          planned_quantity?: number | null
          project_stage_id?: number | null
          work_item_id?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_project_cost: {
        Args: { p_amount: number; p_project_id: string }
        Returns: undefined
      }
    }
    Enums: {
      cost_category_type:
        | "Material"
        | "Labor"
        | "Equipment"
        | "Transport"
        | "Misc"
      issue_status: "Open" | "Closed" | "Rectified"
      project_status: "Not Started" | "In Progress" | "Completed" | "On Hold"
      shift_type: "Day" | "Night" | "Full"
      stage_status: "Not Started" | "In Progress" | "Completed"
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
  public: {
    Enums: {
      cost_category_type: [
        "Material",
        "Labor",
        "Equipment",
        "Transport",
        "Misc",
      ],
      issue_status: ["Open", "Closed", "Rectified"],
      project_status: ["Not Started", "In Progress", "Completed", "On Hold"],
      shift_type: ["Day", "Night", "Full"],
      stage_status: ["Not Started", "In Progress", "Completed"],
    },
  },
} as const
