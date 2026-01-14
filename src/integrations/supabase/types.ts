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
      accommodations: {
        Row: {
          address: string | null
          created_at: string
          dates: string | null
          id: string
          inscription_id: string
          observations: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          dates?: string | null
          id?: string
          inscription_id: string
          observations?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          dates?: string | null
          id?: string
          inscription_id?: string
          observations?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accommodations_inscription_id_fkey"
            columns: ["inscription_id"]
            isOneToOne: false
            referencedRelation: "inscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodations_inscription_id_fkey"
            columns: ["inscription_id"]
            isOneToOne: false
            referencedRelation: "inscriptions_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      inscriptions: {
        Row: {
          balance_after_deposit: number | null
          certification_date: string | null
          certification_result: string | null
          certification_type: string | null
          check_date: string | null
          check_number: string | null
          code: string | null
          course_address: string | null
          course_location: string | null
          course_materials: string | null
          course_type: string | null
          created_at: string
          deposit_amount: number | null
          deposit_date: string | null
          duration_days: number | null
          duration_hours: number | null
          end_date: string
          entry_level: string | null
          entry_test_score: string | null
          expectations: string | null
          final_general_level: string | null
          final_specific_level: string | null
          final_status: string | null
          group_name: string | null
          hours_per_day: number | null
          id: string
          instructor_id: string | null
          language: string
          max_participants: string | null
          modality: string | null
          observations: string | null
          payment_method: string | null
          pedagogical_cost: number | null
          price: number | null
          qualiopi_status: string | null
          rhythm: string | null
          schedule: string | null
          ski_school_id: string | null
          start_date: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          balance_after_deposit?: number | null
          certification_date?: string | null
          certification_result?: string | null
          certification_type?: string | null
          check_date?: string | null
          check_number?: string | null
          code?: string | null
          course_address?: string | null
          course_location?: string | null
          course_materials?: string | null
          course_type?: string | null
          created_at?: string
          deposit_amount?: number | null
          deposit_date?: string | null
          duration_days?: number | null
          duration_hours?: number | null
          end_date: string
          entry_level?: string | null
          entry_test_score?: string | null
          expectations?: string | null
          final_general_level?: string | null
          final_specific_level?: string | null
          final_status?: string | null
          group_name?: string | null
          hours_per_day?: number | null
          id?: string
          instructor_id?: string | null
          language: string
          max_participants?: string | null
          modality?: string | null
          observations?: string | null
          payment_method?: string | null
          pedagogical_cost?: number | null
          price?: number | null
          qualiopi_status?: string | null
          rhythm?: string | null
          schedule?: string | null
          ski_school_id?: string | null
          start_date: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          balance_after_deposit?: number | null
          certification_date?: string | null
          certification_result?: string | null
          certification_type?: string | null
          check_date?: string | null
          check_number?: string | null
          code?: string | null
          course_address?: string | null
          course_location?: string | null
          course_materials?: string | null
          course_type?: string | null
          created_at?: string
          deposit_amount?: number | null
          deposit_date?: string | null
          duration_days?: number | null
          duration_hours?: number | null
          end_date?: string
          entry_level?: string | null
          entry_test_score?: string | null
          expectations?: string | null
          final_general_level?: string | null
          final_specific_level?: string | null
          final_status?: string | null
          group_name?: string | null
          hours_per_day?: number | null
          id?: string
          instructor_id?: string | null
          language?: string
          max_participants?: string | null
          modality?: string | null
          observations?: string | null
          payment_method?: string | null
          pedagogical_cost?: number | null
          price?: number | null
          qualiopi_status?: string | null
          rhythm?: string | null
          schedule?: string | null
          ski_school_id?: string | null
          start_date?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inscriptions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscriptions_ski_school_id_fkey"
            columns: ["ski_school_id"]
            isOneToOne: false
            referencedRelation: "ski_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscriptions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      instructors: {
        Row: {
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          is_active: boolean | null
          languages: string[] | null
          last_name: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          languages?: string[] | null
          last_name: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          languages?: string[] | null
          last_name?: string
          phone?: string | null
        }
        Relationships: []
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
            foreignKeyName: "placement_tests_inscription_id_fkey"
            columns: ["inscription_id"]
            isOneToOne: false
            referencedRelation: "inscriptions_complete"
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
      ski_schools: {
        Row: {
          created_at: string
          director_name: string | null
          director_phone: string | null
          id: string
          name: string
          observations: string | null
        }
        Insert: {
          created_at?: string
          director_name?: string | null
          director_phone?: string | null
          id?: string
          name: string
          observations?: string | null
        }
        Update: {
          created_at?: string
          director_name?: string | null
          director_phone?: string | null
          id?: string
          name?: string
          observations?: string | null
        }
        Relationships: []
      }
      students: {
        Row: {
          city: string | null
          civility: string | null
          company: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string | null
          postal_code: string | null
          street_address: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          civility?: string | null
          company?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          postal_code?: string | null
          street_address?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          civility?: string | null
          company?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          postal_code?: string | null
          street_address?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      inscriptions_complete: {
        Row: {
          balance_after_deposit: number | null
          certification_date: string | null
          certification_result: string | null
          certification_type: string | null
          check_date: string | null
          check_number: string | null
          code: string | null
          course_address: string | null
          course_location: string | null
          course_materials: string | null
          course_type: string | null
          created_at: string | null
          deposit_amount: number | null
          deposit_date: string | null
          duration_days: number | null
          duration_hours: number | null
          end_date: string | null
          entry_level: string | null
          entry_test_score: string | null
          expectations: string | null
          final_general_level: string | null
          final_specific_level: string | null
          final_status: string | null
          group_name: string | null
          hours_per_day: number | null
          id: string | null
          instructor_email: string | null
          instructor_id: string | null
          instructor_name: string | null
          instructor_phone: string | null
          language: string | null
          max_participants: string | null
          modality: string | null
          observations: string | null
          payment_method: string | null
          pedagogical_cost: number | null
          price: number | null
          qualiopi_status: string | null
          rhythm: string | null
          schedule: string | null
          ski_school_director: string | null
          ski_school_director_phone: string | null
          ski_school_id: string | null
          ski_school_name: string | null
          start_date: string | null
          status: string | null
          student_city: string | null
          student_company: string | null
          student_email: string | null
          student_id: string | null
          student_name: string | null
          student_phone: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inscriptions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscriptions_ski_school_id_fkey"
            columns: ["ski_school_id"]
            isOneToOne: false
            referencedRelation: "ski_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscriptions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
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
