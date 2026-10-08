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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      appeals_content: {
        Row: {
          categories: Json
          in_progress: number
          overdue: number
          published_at: string | null
          published_by: string | null
          regions: Json
          resolved: number
          status: Database["public"]["Enums"]["content_status"]
          total: number
          trend: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          categories: Json
          in_progress: number
          overdue: number
          published_at?: string | null
          published_by?: string | null
          regions: Json
          resolved: number
          status: Database["public"]["Enums"]["content_status"]
          total: number
          trend: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          categories?: Json
          in_progress?: number
          overdue?: number
          published_at?: string | null
          published_by?: string | null
          regions?: Json
          resolved?: number
          status?: Database["public"]["Enums"]["content_status"]
          total?: number
          trend?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor: string | null
          id: number
          new_row: Json | null
          occurred_at: string
          old_row: Json | null
          row_status: Database["public"]["Enums"]["content_status"] | null
          table_name: string
        }
        Insert: {
          action: string
          actor?: string | null
          id?: never
          new_row?: Json | null
          occurred_at?: string
          old_row?: Json | null
          row_status?: Database["public"]["Enums"]["content_status"] | null
          table_name: string
        }
        Update: {
          action?: string
          actor?: string | null
          id?: never
          new_row?: Json | null
          occurred_at?: string
          old_row?: Json | null
          row_status?: Database["public"]["Enums"]["content_status"] | null
          table_name?: string
        }
        Relationships: []
      }
      birthday_content: {
        Row: {
          payload: Json
          published_at: string | null
          published_by: string | null
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          payload: Json
          published_at?: string | null
          published_by?: string | null
          status: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          payload?: Json
          published_at?: string | null
          published_by?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      dashboard_owner: {
        Row: {
          singleton: boolean
          user_id: string
        }
        Insert: {
          singleton?: boolean
          user_id: string
        }
        Update: {
          singleton?: boolean
          user_id?: string
        }
        Relationships: []
      }
      dashboard_reports: {
        Row: {
          draft: Json
          id: string
          published: Json | null
          published_at: string | null
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          draft: Json
          id?: string
          published?: Json | null
          published_at?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          draft?: Json
          id?: string
          published?: Json | null
          published_at?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: []
      }
      employee_content: {
        Row: {
          achievements: Json
          department: string
          month: string
          name: string
          photo_path: string | null
          position: string
          published_at: string | null
          published_by: string | null
          recognition: string
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
          updated_by: string | null
          year: number
        }
        Insert: {
          achievements: Json
          department: string
          month: string
          name: string
          photo_path?: string | null
          position: string
          published_at?: string | null
          published_by?: string | null
          recognition: string
          status: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          updated_by?: string | null
          year: number
        }
        Update: {
          achievements?: Json
          department?: string
          month?: string
          name?: string
          photo_path?: string | null
          position?: string
          published_at?: string | null
          published_by?: string | null
          recognition?: string
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          updated_by?: string | null
          year?: number
        }
        Relationships: []
      }
      hr_plans: {
        Row: {
          draft: Json
          id: string
          kind: string
          published: Json | null
          published_at: string | null
          updated_at: string
        }
        Insert: {
          draft: Json
          id?: string
          kind: string
          published?: Json | null
          published_at?: string | null
          updated_at?: string
        }
        Update: {
          draft?: Json
          id?: string
          kind?: string
          published?: Json | null
          published_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      managers_content: {
        Row: {
          payload: Json
          published_at: string | null
          published_by: string | null
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          payload: Json
          published_at?: string | null
          published_by?: string | null
          status: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          payload?: Json
          published_at?: string | null
          published_by?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      president_content: {
        Row: {
          name: string
          portrait_path: string | null
          position: string
          published_at: string | null
          published_by: string | null
          quote: string
          source_date: string
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          name: string
          portrait_path?: string | null
          position: string
          published_at?: string | null
          published_by?: string | null
          quote: string
          source_date: string
          status: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          name?: string
          portrait_path?: string | null
          position?: string
          published_at?: string | null
          published_by?: string | null
          quote?: string
          source_date?: string
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      schedule_content: {
        Row: {
          payload: Json
          published_at: string | null
          published_by: string | null
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          payload: Json
          published_at?: string | null
          published_by?: string | null
          status: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          payload?: Json
          published_at?: string | null
          published_by?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      slide_settings: {
        Row: {
          appeals_enabled: boolean
          durations: Json
          employee_enabled: boolean
          interval_seconds: number
          president_enabled: boolean
          published_at: string | null
          published_by: string | null
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          appeals_enabled: boolean
          durations?: Json
          employee_enabled: boolean
          interval_seconds: number
          president_enabled: boolean
          published_at?: string | null
          published_by?: string | null
          status: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          appeals_enabled?: boolean
          durations?: Json
          employee_enabled?: boolean
          interval_seconds?: number
          president_enabled?: boolean
          published_at?: string | null
          published_by?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_appeals: { Args: never; Returns: boolean }
      can_manage_hr: { Args: never; Returns: boolean }
      can_manage_press: { Args: never; Returns: boolean }
      current_hr_slides: { Args: never; Returns: Json }
      has_any_role: { Args: never; Returns: boolean }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      is_dashboard_owner: { Args: never; Returns: boolean }
      is_dashboard_editor: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      publish_appeals_content: {
        Args: never
        Returns: {
          categories: Json
          in_progress: number
          overdue: number
          published_at: string | null
          published_by: string | null
          regions: Json
          resolved: number
          status: Database["public"]["Enums"]["content_status"]
          total: number
          trend: Json
          updated_at: string
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "appeals_content"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      publish_birthday_content: {
        Args: never
        Returns: {
          payload: Json
          published_at: string | null
          published_by: string | null
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "birthday_content"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      publish_dashboard_report: {
        Args: { expected_version: number; report_id: string }
        Returns: {
          draft: Json
          id: string
          published: Json | null
          published_at: string | null
          updated_at: string
          updated_by: string | null
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "dashboard_reports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      publish_employee_content: {
        Args: never
        Returns: {
          achievements: Json
          department: string
          month: string
          name: string
          photo_path: string | null
          position: string
          published_at: string | null
          published_by: string | null
          recognition: string
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
          updated_by: string | null
          year: number
        }
        SetofOptions: {
          from: "*"
          to: "employee_content"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      publish_hr_plan: {
        Args: { plan_id: string }
        Returns: {
          draft: Json
          id: string
          kind: string
          published: Json | null
          published_at: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "hr_plans"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      publish_managers_content: {
        Args: never
        Returns: {
          payload: Json
          published_at: string | null
          published_by: string | null
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "managers_content"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      publish_president_content: {
        Args: never
        Returns: {
          name: string
          portrait_path: string | null
          position: string
          published_at: string | null
          published_by: string | null
          quote: string
          source_date: string
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "president_content"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      publish_schedule_content: {
        Args: never
        Returns: {
          payload: Json
          published_at: string | null
          published_by: string | null
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "schedule_content"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      publish_slide_settings: {
        Args: never
        Returns: {
          appeals_enabled: boolean
          durations: Json
          employee_enabled: boolean
          interval_seconds: number
          president_enabled: boolean
          published_at: string | null
          published_by: string | null
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "slide_settings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      read_dashboard_reports: { Args: never; Returns: Json }
      save_dashboard_report: {
        Args: { expected_version: number; payload: Json; report_id: string | null }
        Returns: {
          draft: Json
          id: string
          published: Json | null
          published_at: string | null
          updated_at: string
          updated_by: string | null
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "dashboard_reports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_slide_visibility: {
        Args: { _enabled: boolean; _index?: number; _key: string }
        Returns: undefined
      }
      tv_playback_state: { Args: never; Returns: Json }
      valid_dashboard_report: { Args: { p: Json }; Returns: boolean }
      valid_department_content: {
        Args: { kind: string; value: Json }
        Returns: boolean
      }
      valid_hr_plan: {
        Args: { complete?: boolean; kind: string; p: Json }
        Returns: boolean
      }
      valid_slide_durations: { Args: { value: Json }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "appeals_admin"
        | "press_admin"
        | "tv_viewer"
        | "hr_admin"
      content_status: "draft" | "published"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "super_admin",
        "appeals_admin",
        "press_admin",
        "tv_viewer",
        "hr_admin",
      ],
      content_status: ["draft", "published"],
    },
  },
} as const
