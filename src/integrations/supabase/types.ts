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
            foreignKeyName: "inscriptions_ski_school_id_fkey"
            columns: ["ski_school_id"]
            isOneToOne: false
            referencedRelation: "test_bookings_complete"
            referencedColumns: ["ski_school_id"]
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
      instructor_availabilities: {
        Row: {
          booking_id: string | null
          created_at: string
          datetime: string
          id: string
          instructor_id: string
          is_booked: boolean
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          datetime: string
          id?: string
          instructor_id: string
          is_booked?: boolean
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          datetime?: string
          id?: string
          instructor_id?: string
          is_booked?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "instructor_availabilities_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "test_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_availabilities_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "test_bookings_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_availabilities_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
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
      invoices: {
        Row: {
          amount_ht: number
          amount_ttc: number | null
          created_at: string
          due_date: string | null
          fiscal_year: string | null
          id: string
          inscription_id: string | null
          invoice_date: string
          invoice_number: string | null
          invoice_type: string
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          payment_type: string
          related_invoice_id: string | null
          sequence_number: number | null
          status: string
          tva_rate: number | null
          updated_at: string
        }
        Insert: {
          amount_ht?: number
          amount_ttc?: number | null
          created_at?: string
          due_date?: string | null
          fiscal_year?: string | null
          id?: string
          inscription_id?: string | null
          invoice_date?: string
          invoice_number?: string | null
          invoice_type?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_type?: string
          related_invoice_id?: string | null
          sequence_number?: number | null
          status?: string
          tva_rate?: number | null
          updated_at?: string
        }
        Update: {
          amount_ht?: number
          amount_ttc?: number | null
          created_at?: string
          due_date?: string | null
          fiscal_year?: string | null
          id?: string
          inscription_id?: string | null
          invoice_date?: string
          invoice_number?: string | null
          invoice_type?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_type?: string
          related_invoice_id?: string | null
          sequence_number?: number | null
          status?: string
          tva_rate?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_inscription_id_fkey"
            columns: ["inscription_id"]
            isOneToOne: false
            referencedRelation: "inscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_inscription_id_fkey"
            columns: ["inscription_id"]
            isOneToOne: false
            referencedRelation: "inscriptions_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_related_invoice_id_fkey"
            columns: ["related_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string | null
          notes: string | null
          payment_date: string
          payment_method: string
          payment_type: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method: string
          payment_type?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string
          payment_type?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
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
      schools_invoice_policy: {
        Row: {
          active: boolean
          created_at: string
          id: string
          ski_school_id: string
          valid_until: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          ski_school_id: string
          valid_until?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          ski_school_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schools_invoice_policy_ski_school_id_fkey"
            columns: ["ski_school_id"]
            isOneToOne: true
            referencedRelation: "ski_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schools_invoice_policy_ski_school_id_fkey"
            columns: ["ski_school_id"]
            isOneToOne: true
            referencedRelation: "test_bookings_complete"
            referencedColumns: ["ski_school_id"]
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
      test_bookings: {
        Row: {
          candidate_id: string
          created_at: string
          datetime: string
          google_event_id: string | null
          google_meet_link: string | null
          id: string
          instructor_id: string | null
          language: string
          payment_type: string
          previous_result: string | null
          previous_test: boolean
          source: string
          status: string
          stripe_payment_id: string | null
        }
        Insert: {
          candidate_id: string
          created_at?: string
          datetime: string
          google_event_id?: string | null
          google_meet_link?: string | null
          id?: string
          instructor_id?: string | null
          language: string
          payment_type: string
          previous_result?: string | null
          previous_test?: boolean
          source?: string
          status?: string
          stripe_payment_id?: string | null
        }
        Update: {
          candidate_id?: string
          created_at?: string
          datetime?: string
          google_event_id?: string | null
          google_meet_link?: string | null
          id?: string
          instructor_id?: string | null
          language?: string
          payment_type?: string
          previous_result?: string | null
          previous_test?: boolean
          source?: string
          status?: string
          stripe_payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_bookings_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "test_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_bookings_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      test_candidates: {
        Row: {
          carte_syndicale: string | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          photo_face_url: string | null
          photo_id_url: string | null
          profession: string
          profession_autre: string | null
          ski_school_id: string
          student_id: string | null
        }
        Insert: {
          carte_syndicale?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          phone: string
          photo_face_url?: string | null
          photo_id_url?: string | null
          profession: string
          profession_autre?: string | null
          ski_school_id: string
          student_id?: string | null
        }
        Update: {
          carte_syndicale?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          photo_face_url?: string | null
          photo_id_url?: string | null
          profession?: string
          profession_autre?: string | null
          ski_school_id?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_candidates_ski_school_id_fkey"
            columns: ["ski_school_id"]
            isOneToOne: false
            referencedRelation: "ski_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_candidates_ski_school_id_fkey"
            columns: ["ski_school_id"]
            isOneToOne: false
            referencedRelation: "test_bookings_complete"
            referencedColumns: ["ski_school_id"]
          },
          {
            foreignKeyName: "test_candidates_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      test_criteria: {
        Row: {
          active: boolean
          category: string
          created_at: string
          criterion_text: string
          id: string
          language: string
          level: string
          order_index: number
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          criterion_text: string
          id?: string
          language: string
          level: string
          order_index?: number
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          criterion_text?: string
          id?: string
          language?: string
          level?: string
          order_index?: number
        }
        Relationships: []
      }
      test_evaluations: {
        Row: {
          appreciation_comprehension: string | null
          appreciation_conclusion: string | null
          appreciation_grammar: string | null
          appreciation_intro: string | null
          appreciation_technique: string | null
          attestation_sent_at: string | null
          attestation_type: string
          attestation_url: string | null
          booking_id: string
          comments: string | null
          comments_comprehension: string | null
          comments_conclusion: string | null
          comments_expression: string | null
          comments_grammar: string | null
          comments_introduction: string | null
          comments_technique: string | null
          created_at: string
          criteria_checklist: Json | null
          grammar_points: string[] | null
          id: string
          score_comprehension: number
          score_conversation: number
          score_expression: number
          score_general: number
          score_structure: number
          score_technique: number
          scoring_system: string
          selected_phrase_ids: string[] | null
          vocabulary_examples: string[] | null
        }
        Insert: {
          appreciation_comprehension?: string | null
          appreciation_conclusion?: string | null
          appreciation_grammar?: string | null
          appreciation_intro?: string | null
          appreciation_technique?: string | null
          attestation_sent_at?: string | null
          attestation_type: string
          attestation_url?: string | null
          booking_id: string
          comments?: string | null
          comments_comprehension?: string | null
          comments_conclusion?: string | null
          comments_expression?: string | null
          comments_grammar?: string | null
          comments_introduction?: string | null
          comments_technique?: string | null
          created_at?: string
          criteria_checklist?: Json | null
          grammar_points?: string[] | null
          id?: string
          score_comprehension: number
          score_conversation: number
          score_expression: number
          score_general: number
          score_structure: number
          score_technique: number
          scoring_system?: string
          selected_phrase_ids?: string[] | null
          vocabulary_examples?: string[] | null
        }
        Update: {
          appreciation_comprehension?: string | null
          appreciation_conclusion?: string | null
          appreciation_grammar?: string | null
          appreciation_intro?: string | null
          appreciation_technique?: string | null
          attestation_sent_at?: string | null
          attestation_type?: string
          attestation_url?: string | null
          booking_id?: string
          comments?: string | null
          comments_comprehension?: string | null
          comments_conclusion?: string | null
          comments_expression?: string | null
          comments_grammar?: string | null
          comments_introduction?: string | null
          comments_technique?: string | null
          created_at?: string
          criteria_checklist?: Json | null
          grammar_points?: string[] | null
          id?: string
          score_comprehension?: number
          score_conversation?: number
          score_expression?: number
          score_general?: number
          score_structure?: number
          score_technique?: number
          scoring_system?: string
          selected_phrase_ids?: string[] | null
          vocabulary_examples?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "test_evaluations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "test_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_evaluations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "test_bookings_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      test_phrases: {
        Row: {
          active: boolean
          category: string
          code: string | null
          created_at: string
          id: string
          is_positive: boolean
          language: string
          level_max: string | null
          level_min: string | null
          order_index: number
          profession: string | null
          text_fr: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          category: string
          code?: string | null
          created_at?: string
          id?: string
          is_positive?: boolean
          language: string
          level_max?: string | null
          level_min?: string | null
          order_index?: number
          profession?: string | null
          text_fr: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          category?: string
          code?: string | null
          created_at?: string
          id?: string
          is_positive?: boolean
          language?: string
          level_max?: string | null
          level_min?: string | null
          order_index?: number
          profession?: string | null
          text_fr?: string
          updated_at?: string | null
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
            foreignKeyName: "inscriptions_ski_school_id_fkey"
            columns: ["ski_school_id"]
            isOneToOne: false
            referencedRelation: "test_bookings_complete"
            referencedColumns: ["ski_school_id"]
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
      test_bookings_complete: {
        Row: {
          attestation_sent_at: string | null
          attestation_url: string | null
          candidate_email: string | null
          candidate_id: string | null
          candidate_name: string | null
          candidate_phone: string | null
          candidate_photo: string | null
          candidate_profession: string | null
          created_at: string | null
          datetime: string | null
          evaluation_id: string | null
          google_event_id: string | null
          google_meet_link: string | null
          id: string | null
          instructor_email: string | null
          instructor_id: string | null
          instructor_name: string | null
          language: string | null
          payment_type: string | null
          previous_result: string | null
          previous_test: boolean | null
          score_general: number | null
          ski_school_id: string | null
          ski_school_name: string | null
          source: string | null
          status: string | null
          stripe_payment_id: string | null
          student_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_bookings_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "test_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_bookings_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_candidates_student_id_fkey"
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
      get_fiscal_year: { Args: { invoice_date: string }; Returns: string }
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
