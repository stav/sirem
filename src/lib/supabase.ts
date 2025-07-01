import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      contacts: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          prefix: string | null
          first_name: string
          last_name: string
          middle_name: string | null
          suffix: string | null
          phone: string | null
          email: string | null
          medicare_beneficiary_id: string | null
          part_a_status: string | null
          part_b_status: string | null
          height: string | null
          weight: string | null
          gender: string | null
          marital_status: string | null
          has_medicaid: boolean | null
          is_tobacco_user: boolean | null
          birthdate: string | null
          primary_communication: string
          lead_source: string
          contact_record_type: string
          inactive: boolean
          notes: string | null
          life_policy_count: number
          health_policy_count: number
          subsidy_level: string | null
          lead_status_id: string | null
          status: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          prefix?: string | null
          first_name: string
          last_name: string
          middle_name?: string | null
          suffix?: string | null
          phone?: string | null
          email?: string | null
          medicare_beneficiary_id?: string | null
          part_a_status?: string | null
          part_b_status?: string | null
          height?: string | null
          weight?: string | null
          gender?: string | null
          marital_status?: string | null
          has_medicaid?: boolean | null
          is_tobacco_user?: boolean | null
          birthdate?: string | null
          primary_communication?: string
          lead_source?: string
          contact_record_type?: string
          inactive?: boolean
          notes?: string | null
          life_policy_count?: number
          health_policy_count?: number
          subsidy_level?: string | null
          lead_status_id?: string | null
          status?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          prefix?: string | null
          first_name?: string
          last_name?: string
          middle_name?: string | null
          suffix?: string | null
          phone?: string | null
          email?: string | null
          medicare_beneficiary_id?: string | null
          part_a_status?: string | null
          part_b_status?: string | null
          height?: string | null
          weight?: string | null
          gender?: string | null
          marital_status?: string | null
          has_medicaid?: boolean | null
          is_tobacco_user?: boolean | null
          birthdate?: string | null
          primary_communication?: string
          lead_source?: string
          contact_record_type?: string
          inactive?: boolean
          notes?: string | null
          life_policy_count?: number
          health_policy_count?: number
          subsidy_level?: string | null
          lead_status_id?: string | null
          status?: string | null
        }
      }
      reminders: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          contact_id: string
          title: string
          description: string | null
          reminder_date: string
          reminder_source: string
          reminder_type: string | null
          is_complete: boolean
          completed_date: string | null
          priority: 'low' | 'medium' | 'high'
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          contact_id: string
          title: string
          description?: string | null
          reminder_date: string
          reminder_source?: string
          reminder_type?: string | null
          is_complete?: boolean
          completed_date?: string | null
          priority?: 'low' | 'medium' | 'high'
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          contact_id?: string
          title?: string
          description?: string | null
          reminder_date?: string
          reminder_source?: string
          reminder_type?: string | null
          is_complete?: boolean
          completed_date?: string | null
          priority?: 'low' | 'medium' | 'high'
        }
      }
      addresses: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          contact_id: string
          address1: string | null
          address2: string | null
          city: string | null
          state_code: string | null
          postal_code: string | null
          county: string | null
          county_fips: string | null
          latitude: number | null
          longitude: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          contact_id: string
          address1?: string | null
          address2?: string | null
          city?: string | null
          state_code?: string | null
          postal_code?: string | null
          county?: string | null
          county_fips?: string | null
          latitude?: number | null
          longitude?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          contact_id?: string
          address1?: string | null
          address2?: string | null
          city?: string | null
          state_code?: string | null
          postal_code?: string | null
          county?: string | null
          county_fips?: string | null
          latitude?: number | null
          longitude?: number | null
        }
      }
      phones: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          contact_id: string
          phone_number: string
          phone_label: string | null
          inactive: boolean
          is_sms_compatible: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          contact_id: string
          phone_number: string
          phone_label?: string | null
          inactive?: boolean
          is_sms_compatible?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          contact_id?: string
          phone_number?: string
          phone_label?: string | null
          inactive?: boolean
          is_sms_compatible?: boolean
        }
      }
      emails: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          contact_id: string
          email_address: string
          email_label: string | null
          inactive: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          contact_id: string
          email_address: string
          email_label?: string | null
          inactive?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          contact_id?: string
          email_address?: string
          email_label?: string | null
          inactive?: boolean
        }
      }
      tag_categories: {
        Row: {
          id: string
          created_at: string
          name: string
          color: string
          is_active: boolean
          parent_category_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          color?: string
          is_active?: boolean
          parent_category_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          color?: string
          is_active?: boolean
          parent_category_id?: string | null
        }
      }
      tags: {
        Row: {
          id: string
          created_at: string
          label: string
          category_id: string
          icon_url: string | null
          metadata: Record<string, unknown> | null
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          label: string
          category_id: string
          icon_url?: string | null
          metadata?: Record<string, unknown> | null
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          label?: string
          category_id?: string
          icon_url?: string | null
          metadata?: Record<string, unknown> | null
          is_active?: boolean
        }
      }
      contact_tags: {
        Row: {
          id: string
          created_at: string
          contact_id: string
          tag_id: string
          metadata: Record<string, unknown> | null
          interaction_url: string | null
          interaction_url_label: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          contact_id: string
          tag_id: string
          metadata?: Record<string, unknown> | null
          interaction_url?: string | null
          interaction_url_label?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          contact_id?: string
          tag_id?: string
          metadata?: Record<string, unknown> | null
          interaction_url?: string | null
          interaction_url_label?: string | null
        }
      }
      lead_statuses: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string | null
          color: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description?: string | null
          color?: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string | null
          color?: string
        }
      }
      activities: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          contact_id: string
          activity_type: string
          title: string
          description: string | null
          activity_date: string
          duration_minutes: number | null
          outcome: string | null
          metadata: Record<string, unknown> | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          contact_id: string
          activity_type: string
          title: string
          description?: string | null
          activity_date: string
          duration_minutes?: number | null
          outcome?: string | null
          metadata?: Record<string, unknown> | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          contact_id?: string
          activity_type?: string
          title?: string
          description?: string | null
          activity_date?: string
          duration_minutes?: number | null
          outcome?: string | null
          metadata?: Record<string, unknown> | null
        }
      }
    }
  }
} 
