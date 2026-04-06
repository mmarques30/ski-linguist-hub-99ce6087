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
      app_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      availability_requests: {
        Row: {
          assigned_instructor_id: string | null
          created_at: string
          end_date: string
          id: string
          instructors_contacted: string[] | null
          language: string
          message: string | null
          sent_at: string | null
          start_date: string
          status: string
          zone: string | null
        }
        Insert: {
          assigned_instructor_id?: string | null
          created_at?: string
          end_date: string
          id?: string
          instructors_contacted?: string[] | null
          language: string
          message?: string | null
          sent_at?: string | null
          start_date: string
          status?: string
          zone?: string | null
        }
        Update: {
          assigned_instructor_id?: string | null
          created_at?: string
          end_date?: string
          id?: string
          instructors_contacted?: string[] | null
          language?: string
          message?: string | null
          sent_at?: string | null
          start_date?: string
          status?: string
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_requests_assigned_instructor_id_fkey"
            columns: ["assigned_instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          attendance_rate: number | null
          created_at: string
          id: string
          inscription_id: string
          issue_date: string
          level_achieved: string
          pdf_url: string | null
          student_id: string
        }
        Insert: {
          attendance_rate?: number | null
          created_at?: string
          id?: string
          inscription_id: string
          issue_date?: string
          level_achieved: string
          pdf_url?: string | null
          student_id: string
        }
        Update: {
          attendance_rate?: number | null
          created_at?: string
          id?: string
          inscription_id?: string
          issue_date?: string
          level_achieved?: string
          pdf_url?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_inscription_id_fkey"
            columns: ["inscription_id"]
            isOneToOne: false
            referencedRelation: "inscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_inscription_id_fkey"
            columns: ["inscription_id"]
            isOneToOne: false
            referencedRelation: "inscriptions_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      continuous_improvement: {
        Row: {
          action: string
          created_at: string
          end_date: string | null
          id: string
          problem: string | null
          source: string | null
          start_date: string
          status: string
          theme: string | null
          type: string
          updated_at: string
        }
        Insert: {
          action: string
          created_at?: string
          end_date?: string | null
          id?: string
          problem?: string | null
          source?: string | null
          start_date?: string
          status?: string
          theme?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          action?: string
          created_at?: string
          end_date?: string | null
          id?: string
          problem?: string | null
          source?: string | null
          start_date?: string
          status?: string
          theme?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      cost_templates: {
        Row: {
          actif: boolean | null
          cost_type: string
          created_at: string
          description: string | null
          id: string
          montant_mensuel: number
        }
        Insert: {
          actif?: boolean | null
          cost_type: string
          created_at?: string
          description?: string | null
          id?: string
          montant_mensuel: number
        }
        Update: {
          actif?: boolean | null
          cost_type?: string
          created_at?: string
          description?: string | null
          id?: string
          montant_mensuel?: number
        }
        Relationships: []
      }
      document_sendings: {
        Row: {
          created_at: string
          document_type: string
          id: string
          inscription_id: string
          opened_at: string | null
          pdf_url: string | null
          sent_at: string
          sent_to: string
        }
        Insert: {
          created_at?: string
          document_type: string
          id?: string
          inscription_id: string
          opened_at?: string | null
          pdf_url?: string | null
          sent_at?: string
          sent_to: string
        }
        Update: {
          created_at?: string
          document_type?: string
          id?: string
          inscription_id?: string
          opened_at?: string | null
          pdf_url?: string | null
          sent_at?: string
          sent_to?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_sendings_inscription_id_fkey"
            columns: ["inscription_id"]
            isOneToOne: false
            referencedRelation: "inscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_sendings_inscription_id_fkey"
            columns: ["inscription_id"]
            isOneToOne: false
            referencedRelation: "inscriptions_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      fixed_costs: {
        Row: {
          cost_type: string
          created_at: string
          date_paiement: string | null
          description: string | null
          id: string
          mois: string
          montant: number
          paye: boolean | null
          recurrent: boolean | null
        }
        Insert: {
          cost_type: string
          created_at?: string
          date_paiement?: string | null
          description?: string | null
          id?: string
          mois: string
          montant: number
          paye?: boolean | null
          recurrent?: boolean | null
        }
        Update: {
          cost_type?: string
          created_at?: string
          date_paiement?: string | null
          description?: string | null
          id?: string
          mois?: string
          montant?: number
          paye?: boolean | null
          recurrent?: boolean | null
        }
        Relationships: []
      }
      formation_costs: {
        Row: {
          cost_type: string
          created_at: string
          date_cout: string | null
          description: string | null
          document_url: string | null
          id: string
          inscription_id: string | null
          instructor_id: string | null
          montant_ht: number
          montant_ttc: number
          montant_tva: number | null
          updated_at: string
        }
        Insert: {
          cost_type: string
          created_at?: string
          date_cout?: string | null
          description?: string | null
          document_url?: string | null
          id?: string
          inscription_id?: string | null
          instructor_id?: string | null
          montant_ht: number
          montant_ttc: number
          montant_tva?: number | null
          updated_at?: string
        }
        Update: {
          cost_type?: string
          created_at?: string
          date_cout?: string | null
          description?: string | null
          document_url?: string | null
          id?: string
          inscription_id?: string | null
          instructor_id?: string | null
          montant_ht?: number
          montant_ttc?: number
          montant_tva?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "formation_costs_inscription_id_fkey"
            columns: ["inscription_id"]
            isOneToOne: false
            referencedRelation: "inscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formation_costs_inscription_id_fkey"
            columns: ["inscription_id"]
            isOneToOne: false
            referencedRelation: "inscriptions_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formation_costs_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      inscriptions: {
        Row: {
          balance_after_deposit: number | null
          bpf_category_c: string | null
          bpf_category_f: string | null
          certificate_level: string | null
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
          documents_sent_at: string | null
          duration_days: number | null
          duration_hours: number | null
          end_date: string
          end_pack_sent_at: string | null
          entry_level: string | null
          entry_test_id: string | null
          entry_test_score: string | null
          exit_level: string | null
          exit_test_id: string | null
          expectations: string | null
          final_general_level: string | null
          final_specific_level: string | null
          final_status: string | null
          funding_details: string | null
          funding_organization: string | null
          group_name: string | null
          group_size: number | null
          hours_per_day: number | null
          id: string
          instructor_id: string | null
          language: string
          max_participants: string | null
          modality: string | null
          observations: string | null
          partner_id: string | null
          payment_method: string | null
          pedagogical_cost: number | null
          price: number | null
          progression: string | null
          qualiopi_status: string | null
          rhythm: string | null
          schedule: string | null
          ski_school_id: string | null
          start_date: string
          status: string
          status_changed_at: string | null
          status_changed_by: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          balance_after_deposit?: number | null
          bpf_category_c?: string | null
          bpf_category_f?: string | null
          certificate_level?: string | null
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
          documents_sent_at?: string | null
          duration_days?: number | null
          duration_hours?: number | null
          end_date: string
          end_pack_sent_at?: string | null
          entry_level?: string | null
          entry_test_id?: string | null
          entry_test_score?: string | null
          exit_level?: string | null
          exit_test_id?: string | null
          expectations?: string | null
          final_general_level?: string | null
          final_specific_level?: string | null
          final_status?: string | null
          funding_details?: string | null
          funding_organization?: string | null
          group_name?: string | null
          group_size?: number | null
          hours_per_day?: number | null
          id?: string
          instructor_id?: string | null
          language: string
          max_participants?: string | null
          modality?: string | null
          observations?: string | null
          partner_id?: string | null
          payment_method?: string | null
          pedagogical_cost?: number | null
          price?: number | null
          progression?: string | null
          qualiopi_status?: string | null
          rhythm?: string | null
          schedule?: string | null
          ski_school_id?: string | null
          start_date: string
          status?: string
          status_changed_at?: string | null
          status_changed_by?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          balance_after_deposit?: number | null
          bpf_category_c?: string | null
          bpf_category_f?: string | null
          certificate_level?: string | null
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
          documents_sent_at?: string | null
          duration_days?: number | null
          duration_hours?: number | null
          end_date?: string
          end_pack_sent_at?: string | null
          entry_level?: string | null
          entry_test_id?: string | null
          entry_test_score?: string | null
          exit_level?: string | null
          exit_test_id?: string | null
          expectations?: string | null
          final_general_level?: string | null
          final_specific_level?: string | null
          final_status?: string | null
          funding_details?: string | null
          funding_organization?: string | null
          group_name?: string | null
          group_size?: number | null
          hours_per_day?: number | null
          id?: string
          instructor_id?: string | null
          language?: string
          max_participants?: string | null
          modality?: string | null
          observations?: string | null
          partner_id?: string | null
          payment_method?: string | null
          pedagogical_cost?: number | null
          price?: number | null
          progression?: string | null
          qualiopi_status?: string | null
          rhythm?: string | null
          schedule?: string | null
          ski_school_id?: string | null
          start_date?: string
          status?: string
          status_changed_at?: string | null
          status_changed_by?: string | null
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
            foreignKeyName: "inscriptions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
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
          availability_status: string | null
          booking_id: string | null
          created_at: string
          created_by: string | null
          date: string | null
          datetime: string
          id: string
          instructor_id: string
          is_booked: boolean
          notes: string | null
        }
        Insert: {
          availability_status?: string | null
          booking_id?: string | null
          created_at?: string
          created_by?: string | null
          date?: string | null
          datetime: string
          id?: string
          instructor_id: string
          is_booked?: boolean
          notes?: string | null
        }
        Update: {
          availability_status?: string | null
          booking_id?: string | null
          created_at?: string
          created_by?: string | null
          date?: string | null
          datetime?: string
          id?: string
          instructor_id?: string
          is_booked?: boolean
          notes?: string | null
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
      instructor_contracts: {
        Row: {
          contract_number: string | null
          created_at: string
          end_date: string
          generated_at: string
          hourly_rate: number
          id: string
          inscription_id: string | null
          instructor_id: string
          location: string | null
          pdf_url: string | null
          sent_at: string | null
          signature_data: string | null
          signature_token: string | null
          signed_at: string | null
          start_date: string
          student_or_company: string | null
          total_amount: number
          total_hours: number
        }
        Insert: {
          contract_number?: string | null
          created_at?: string
          end_date: string
          generated_at?: string
          hourly_rate: number
          id?: string
          inscription_id?: string | null
          instructor_id: string
          location?: string | null
          pdf_url?: string | null
          sent_at?: string | null
          signature_data?: string | null
          signature_token?: string | null
          signed_at?: string | null
          start_date: string
          student_or_company?: string | null
          total_amount: number
          total_hours: number
        }
        Update: {
          contract_number?: string | null
          created_at?: string
          end_date?: string
          generated_at?: string
          hourly_rate?: number
          id?: string
          inscription_id?: string | null
          instructor_id?: string
          location?: string | null
          pdf_url?: string | null
          sent_at?: string | null
          signature_data?: string | null
          signature_token?: string | null
          signed_at?: string | null
          start_date?: string
          student_or_company?: string | null
          total_amount?: number
          total_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "instructor_contracts_inscription_id_fkey"
            columns: ["inscription_id"]
            isOneToOne: false
            referencedRelation: "inscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_contracts_inscription_id_fkey"
            columns: ["inscription_id"]
            isOneToOne: false
            referencedRelation: "inscriptions_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_contracts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_payments: {
        Row: {
          created_at: string
          date_paiement: string | null
          id: string
          instructor_id: string
          montant: number
          moyen_paiement: string | null
          notes: string | null
          periode_debut: string
          periode_fin: string
          reference_paiement: string | null
          statut: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_paiement?: string | null
          id?: string
          instructor_id: string
          montant: number
          moyen_paiement?: string | null
          notes?: string | null
          periode_debut: string
          periode_fin: string
          reference_paiement?: string | null
          statut?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_paiement?: string | null
          id?: string
          instructor_id?: string
          montant?: number
          moyen_paiement?: string | null
          notes?: string | null
          periode_debut?: string
          periode_fin?: string
          reference_paiement?: string | null
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_payments_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructors: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          first_name: string | null
          geographic_zones: string[] | null
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          languages: string[] | null
          last_name: string
          phone: string | null
          postal_code: string | null
          siret: string | null
          specialties: string[] | null
          specialty_details: string | null
          status: string | null
          status_notes: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          geographic_zones?: string[] | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          languages?: string[] | null
          last_name: string
          phone?: string | null
          postal_code?: string | null
          siret?: string | null
          specialties?: string[] | null
          specialty_details?: string | null
          status?: string | null
          status_notes?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          geographic_zones?: string[] | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          languages?: string[] | null
          last_name?: string
          phone?: string | null
          postal_code?: string | null
          siret?: string | null
          specialties?: string[] | null
          specialty_details?: string | null
          status?: string | null
          status_notes?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount_ht: number
          amount_ttc: number | null
          client_type: string
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
          reminder_1_sent_at: string | null
          reminder_2_sent_at: string | null
          reminder_3_sent_at: string | null
          sequence_number: number | null
          status: string
          tva_rate: number | null
          updated_at: string
        }
        Insert: {
          amount_ht?: number
          amount_ttc?: number | null
          client_type?: string
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
          reminder_1_sent_at?: string | null
          reminder_2_sent_at?: string | null
          reminder_3_sent_at?: string | null
          sequence_number?: number | null
          status?: string
          tva_rate?: number | null
          updated_at?: string
        }
        Update: {
          amount_ht?: number
          amount_ttc?: number | null
          client_type?: string
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
          reminder_1_sent_at?: string | null
          reminder_2_sent_at?: string | null
          reminder_3_sent_at?: string | null
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
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_contacts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_primary: boolean
          name: string
          partner_id: string
          phone: string | null
          role: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          name: string
          partner_id: string
          phone?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          name?: string
          partner_id?: string
          phone?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_contacts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_contracts: {
        Row: {
          contract_type: string
          created_at: string
          document_url: string | null
          id: string
          negotiated_rate: number | null
          notes: string | null
          partner_id: string
          payment_terms: string | null
          signed_date: string | null
          updated_at: string
          volume_commitment: string | null
        }
        Insert: {
          contract_type?: string
          created_at?: string
          document_url?: string | null
          id?: string
          negotiated_rate?: number | null
          notes?: string | null
          partner_id: string
          payment_terms?: string | null
          signed_date?: string | null
          updated_at?: string
          volume_commitment?: string | null
        }
        Update: {
          contract_type?: string
          created_at?: string
          document_url?: string | null
          id?: string
          negotiated_rate?: number | null
          notes?: string | null
          partner_id?: string
          payment_terms?: string | null
          signed_date?: string | null
          updated_at?: string
          volume_commitment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_contracts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          contract_end_date: string | null
          contract_start_date: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          station: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          station?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          station?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          cheque_bank: string | null
          cheque_date: string | null
          cheque_deposit_date: string | null
          cheque_deposited: boolean | null
          cheque_number: string | null
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
          cheque_bank?: string | null
          cheque_date?: string | null
          cheque_deposit_date?: string | null
          cheque_deposited?: boolean | null
          cheque_number?: string | null
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
          cheque_bank?: string | null
          cheque_date?: string | null
          cheque_deposit_date?: string | null
          cheque_deposited?: boolean | null
          cheque_number?: string | null
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
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      prospects: {
        Row: {
          created_at: string
          email: string | null
          first_contact_date: string | null
          id: string
          name: string
          next_action_date: string | null
          next_action_notes: string | null
          notes: string | null
          phone: string | null
          source: string | null
          status: string
          type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_contact_date?: string | null
          id?: string
          name: string
          next_action_date?: string | null
          next_action_notes?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_contact_date?: string | null
          id?: string
          name?: string
          next_action_date?: string | null
          next_action_notes?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      satisfaction_surveys: {
        Row: {
          completed_at: string | null
          created_at: string
          exit_test_scores: Json | null
          id: string
          inscription_id: string
          reminder_1_sent_at: string | null
          reminder_2_sent_at: string | null
          satisfaction_animation: number | null
          satisfaction_content: number | null
          satisfaction_duration: number | null
          satisfaction_expectations: number | null
          satisfaction_materials: number | null
          satisfaction_organization: number | null
          satisfaction_utility: number | null
          strong_points: string | null
          student_id: string
          token: string
          weak_points: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          exit_test_scores?: Json | null
          id?: string
          inscription_id: string
          reminder_1_sent_at?: string | null
          reminder_2_sent_at?: string | null
          satisfaction_animation?: number | null
          satisfaction_content?: number | null
          satisfaction_duration?: number | null
          satisfaction_expectations?: number | null
          satisfaction_materials?: number | null
          satisfaction_organization?: number | null
          satisfaction_utility?: number | null
          strong_points?: string | null
          student_id: string
          token?: string
          weak_points?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          exit_test_scores?: Json | null
          id?: string
          inscription_id?: string
          reminder_1_sent_at?: string | null
          reminder_2_sent_at?: string | null
          satisfaction_animation?: number | null
          satisfaction_content?: number | null
          satisfaction_duration?: number | null
          satisfaction_expectations?: number | null
          satisfaction_materials?: number | null
          satisfaction_organization?: number | null
          satisfaction_utility?: number | null
          strong_points?: string | null
          student_id?: string
          token?: string
          weak_points?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "satisfaction_surveys_inscription_id_fkey"
            columns: ["inscription_id"]
            isOneToOne: false
            referencedRelation: "inscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "satisfaction_surveys_inscription_id_fkey"
            columns: ["inscription_id"]
            isOneToOne: false
            referencedRelation: "inscriptions_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "satisfaction_surveys_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_reminders: {
        Row: {
          created_at: string
          id: string
          related_id: string
          related_table: string
          scheduled_for: string
          sent_at: string | null
          status: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          related_id: string
          related_table: string
          scheduled_for: string
          sent_at?: string | null
          status?: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          related_id?: string
          related_table?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          type?: string
        }
        Relationships: []
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
      user_permissions: {
        Row: {
          can_edit: boolean | null
          can_view: boolean | null
          created_at: string | null
          id: string
          route_key: string
          user_id: string
        }
        Insert: {
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          route_key: string
          user_id: string
        }
        Update: {
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          route_key?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
          status_changed_at: string | null
          status_changed_by: string | null
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
      get_user_role: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
