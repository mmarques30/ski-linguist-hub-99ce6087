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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      inscriptions: {
        Row: {
          certification: string | null
          created_at: string
          duration_hours: number | null
          expectations: string | null
          fifpl_coverage: number | null
          funding_type: string | null
          id: string
          initial_level: string | null
          inscription_code: string | null
          language: string | null
          location: string | null
          modality: string | null
          preferred_time: string | null
          rgpd_consent: boolean | null
          status: string | null
          student_id: string
          student_payment: number | null
          terms_accepted: boolean | null
          total_price: number | null
        }
        Insert: {
          certification?: string | null
          created_at?: string
          duration_hours?: number | null
          expectations?: string | null
          fifpl_coverage?: number | null
          funding_type?: string | null
          id?: string
          initial_level?: string | null
          inscription_code?: string | null
          language?: string | null
          location?: string | null
          modality?: string | null
          preferred_time?: string | null
          rgpd_consent?: boolean | null
          status?: string | null
          student_id: string
          student_payment?: number | null
          terms_accepted?: boolean | null
          total_price?: number | null
        }
        Update: {
          certification?: string | null
          created_at?: string
          duration_hours?: number | null
          expectations?: string | null
          fifpl_coverage?: number | null
          funding_type?: string | null
          id?: string
          initial_level?: string | null
          inscription_code?: string | null
          language?: string | null
          location?: string | null
          modality?: string | null
          preferred_time?: string | null
          rgpd_consent?: boolean | null
          status?: string | null
          student_id?: string
          student_payment?: number | null
          terms_accepted?: boolean | null
          total_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inscriptions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      placement_test_questions: {
        Row: {
          category: string | null
          correct_answer: string
          created_at: string
          explanation: string | null
          id: string
          is_active: boolean | null
          language: string
          level: string
          options: Json
          order_index: number | null
          question_text: string
        }
        Insert: {
          category?: string | null
          correct_answer: string
          created_at?: string
          explanation?: string | null
          id?: string
          is_active?: boolean | null
          language: string
          level: string
          options: Json
          order_index?: number | null
          question_text: string
        }
        Update: {
          category?: string | null
          correct_answer?: string
          created_at?: string
          explanation?: string | null
          id?: string
          is_active?: boolean | null
          language?: string
          level?: string
          options?: Json
          order_index?: number | null
          question_text?: string
        }
        Relationships: []
      }
      placement_tests: {
        Row: {
          answers: Json | null
          completed_at: string | null
          correct_answers: number | null
          created_at: string
          determined_level: string | null
          id: string
          inscription_id: string | null
          language: string
          score_percentage: number | null
          status: string | null
          student_id: string
          total_questions: number | null
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          correct_answers?: number | null
          created_at?: string
          determined_level?: string | null
          id?: string
          inscription_id?: string | null
          language: string
          score_percentage?: number | null
          status?: string | null
          student_id: string
          total_questions?: number | null
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          correct_answers?: number | null
          created_at?: string
          determined_level?: string | null
          id?: string
          inscription_id?: string | null
          language?: string
          score_percentage?: number | null
          status?: string | null
          student_id?: string
          total_questions?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "placement_tests_inscription_id_fkey"
            columns: ["inscription_id"]
            isOneToOne: false
            referencedRelation: "inscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placement_tests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_profiles: {
        Row: {
          cfp_contribution_amount: number | null
          created_at: string
          id: string
          profession: string | null
          ski_school: string | null
          student_id: string
        }
        Insert: {
          cfp_contribution_amount?: number | null
          created_at?: string
          id?: string
          profession?: string | null
          ski_school?: string | null
          student_id: string
        }
        Update: {
          cfp_contribution_amount?: number | null
          created_at?: string
          id?: string
          profession?: string | null
          ski_school?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_profiles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          city: string | null
          civility: string | null
          created_at: string
          email: string
          first_name: string
          has_handicap: boolean | null
          id: string
          identity_document_url: string | null
          last_name: string
          phone: string
          postal_code: string | null
          status: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          civility?: string | null
          created_at?: string
          email: string
          first_name: string
          has_handicap?: boolean | null
          id?: string
          identity_document_url?: string | null
          last_name: string
          phone: string
          postal_code?: string | null
          status?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          civility?: string | null
          created_at?: string
          email?: string
          first_name?: string
          has_handicap?: boolean | null
          id?: string
          identity_document_url?: string | null
          last_name?: string
          phone?: string
          postal_code?: string | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_inscription_code: { Args: never; Returns: string }
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
  public: {
    Enums: {},
  },
} as const
