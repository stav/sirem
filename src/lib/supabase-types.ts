export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5'
  }
  public: {
    Tables: {
      actions: {
        Row: {
          completed_date: string | null
          contact_id: string
          created_at: string
          description: string | null
          duration: number | null
          end_date: string | null
          id: string
          metadata: Json | null
          outcome: string | null
          priority: string | null
          source: string | null
          start_date: string | null
          status: string | null
          tags: string | null
          title: string
          updated_at: string
        }
        Insert: {
          completed_date?: string | null
          contact_id: string
          created_at?: string
          description?: string | null
          duration?: number | null
          end_date?: string | null
          id?: string
          metadata?: Json | null
          outcome?: string | null
          priority?: string | null
          source?: string | null
          start_date?: string | null
          status?: string | null
          tags?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          completed_date?: string | null
          contact_id?: string
          created_at?: string
          description?: string | null
          duration?: number | null
          end_date?: string | null
          id?: string
          metadata?: Json | null
          outcome?: string | null
          priority?: string | null
          source?: string | null
          start_date?: string | null
          status?: string | null
          tags?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'actions_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'contacts'
            referencedColumns: ['id']
          },
        ]
      }
      activities: {
        Row: {
          activity_date: string
          activity_type: string
          contact_id: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          metadata: Json | null
          outcome: string | null
          title: string
          updated_at: string
        }
        Insert: {
          activity_date: string
          activity_type: string
          contact_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          metadata?: Json | null
          outcome?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          activity_date?: string
          activity_type?: string
          contact_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          metadata?: Json | null
          outcome?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'activities_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'contacts'
            referencedColumns: ['id']
          },
        ]
      }
      addresses: {
        Row: {
          address_type: string | null
          address1: string | null
          address2: string | null
          city: string | null
          contact_id: string
          county: string | null
          county_fips: string | null
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          postal_code: string | null
          source: string | null
          state_code: string | null
          updated_at: string
        }
        Insert: {
          address_type?: string | null
          address1?: string | null
          address2?: string | null
          city?: string | null
          contact_id: string
          county?: string | null
          county_fips?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          postal_code?: string | null
          source?: string | null
          state_code?: string | null
          updated_at?: string
        }
        Update: {
          address_type?: string | null
          address1?: string | null
          address2?: string | null
          city?: string | null
          contact_id?: string
          county?: string | null
          county_fips?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          postal_code?: string | null
          source?: string | null
          state_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'addresses_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'contacts'
            referencedColumns: ['id']
          },
        ]
      }
      contact_roles: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          role_data: Json | null
          role_type: string
          updated_at: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          role_data?: Json | null
          role_type: string
          updated_at?: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          role_data?: Json | null
          role_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'contact_roles_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'contacts'
            referencedColumns: ['id']
          },
        ]
      }
      contact_tags: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          interaction_url: string | null
          interaction_url_label: string | null
          metadata: Json | null
          tag_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          interaction_url?: string | null
          interaction_url_label?: string | null
          metadata?: Json | null
          tag_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          interaction_url?: string | null
          interaction_url_label?: string | null
          metadata?: Json | null
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'contact_tags_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'contacts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'contact_tags_tag_id_fkey'
            columns: ['tag_id']
            isOneToOne: false
            referencedRelation: 'tags'
            referencedColumns: ['id']
          },
        ]
      }
      contacts: {
        Row: {
          birthdate: string | null
          contact_record_type: string | null
          created_at: string
          email: string | null
          first_name: string
          gender: string | null
          has_medicaid: boolean | null
          health_policy_count: number | null
          height: string | null
          id: string
          inactive: boolean | null
          is_tobacco_user: boolean | null
          last_name: string
          lead_source: string | null
          lead_status_id: string | null
          life_policy_count: number | null
          marital_status: string | null
          medicare_beneficiary_id: string | null
          middle_name: string | null
          notes: string | null
          part_a_status: string | null
          part_b_status: string | null
          phone: string | null
          prefix: string | null
          primary_communication: string | null
          ssn: string | null
          status: string | null
          subsidy_level: string | null
          suffix: string | null
          updated_at: string
          weight: string | null
        }
        Insert: {
          birthdate?: string | null
          contact_record_type?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          gender?: string | null
          has_medicaid?: boolean | null
          health_policy_count?: number | null
          height?: string | null
          id?: string
          inactive?: boolean | null
          is_tobacco_user?: boolean | null
          last_name: string
          lead_source?: string | null
          lead_status_id?: string | null
          life_policy_count?: number | null
          marital_status?: string | null
          medicare_beneficiary_id?: string | null
          middle_name?: string | null
          notes?: string | null
          part_a_status?: string | null
          part_b_status?: string | null
          phone?: string | null
          prefix?: string | null
          primary_communication?: string | null
          ssn?: string | null
          status?: string | null
          subsidy_level?: string | null
          suffix?: string | null
          updated_at?: string
          weight?: string | null
        }
        Update: {
          birthdate?: string | null
          contact_record_type?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          gender?: string | null
          has_medicaid?: boolean | null
          health_policy_count?: number | null
          height?: string | null
          id?: string
          inactive?: boolean | null
          is_tobacco_user?: boolean | null
          last_name?: string
          lead_source?: string | null
          lead_status_id?: string | null
          life_policy_count?: number | null
          marital_status?: string | null
          medicare_beneficiary_id?: string | null
          middle_name?: string | null
          notes?: string | null
          part_a_status?: string | null
          part_b_status?: string | null
          phone?: string | null
          prefix?: string | null
          primary_communication?: string | null
          ssn?: string | null
          status?: string | null
          subsidy_level?: string | null
          suffix?: string | null
          updated_at?: string
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'contacts_lead_status_id_fkey'
            columns: ['lead_status_id']
            isOneToOne: false
            referencedRelation: 'lead_statuses'
            referencedColumns: ['id']
          },
        ]
      }
      emails: {
        Row: {
          contact_id: string
          created_at: string
          email_address: string
          email_label: string | null
          id: string
          inactive: boolean | null
          updated_at: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          email_address: string
          email_label?: string | null
          id?: string
          inactive?: boolean | null
          updated_at?: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          email_address?: string
          email_label?: string | null
          id?: string
          inactive?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'emails_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'contacts'
            referencedColumns: ['id']
          },
        ]
      }
      enrollments: {
        Row: {
          agent_notes: string | null
          application_id: string | null
          contact_id: string
          coverage_effective_date: string | null
          coverage_end_date: string | null
          created_at: string
          disenrollment_reason: string | null
          enrollment_status: string | null
          id: string
          metadata: Json | null
          pcp_id: string | null
          pcp_name: string | null
          plan_id: string
          premium_monthly_at_enrollment: number | null
          signed_up_at: string | null
          updated_at: string
        }
        Insert: {
          agent_notes?: string | null
          application_id?: string | null
          contact_id: string
          coverage_effective_date?: string | null
          coverage_end_date?: string | null
          created_at?: string
          disenrollment_reason?: string | null
          enrollment_status?: string | null
          id?: string
          metadata?: Json | null
          pcp_id?: string | null
          pcp_name?: string | null
          plan_id: string
          premium_monthly_at_enrollment?: number | null
          signed_up_at?: string | null
          updated_at?: string
        }
        Update: {
          agent_notes?: string | null
          application_id?: string | null
          contact_id?: string
          coverage_effective_date?: string | null
          coverage_end_date?: string | null
          created_at?: string
          disenrollment_reason?: string | null
          enrollment_status?: string | null
          id?: string
          metadata?: Json | null
          pcp_id?: string | null
          pcp_name?: string | null
          plan_id?: string
          premium_monthly_at_enrollment?: number | null
          signed_up_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'enrollments_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'contacts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'enrollments_plan_id_fkey'
            columns: ['plan_id']
            isOneToOne: false
            referencedRelation: 'plans'
            referencedColumns: ['id']
          },
        ]
      }
      lead_statuses: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      phones: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          inactive: boolean | null
          is_sms_compatible: boolean | null
          phone_label: string | null
          phone_number: string
          updated_at: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          inactive?: boolean | null
          is_sms_compatible?: boolean | null
          phone_label?: string | null
          phone_number: string
          updated_at?: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          inactive?: boolean | null
          is_sms_compatible?: boolean | null
          phone_label?: string | null
          phone_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'phones_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'contacts'
            referencedColumns: ['id']
          },
        ]
      }
      plans: {
        Row: {
          carrier: string | null
          cms_contract_number: string | null
          cms_geo_segment: string | null
          cms_plan_number: string | null
          counties: string[] | null
          created_at: string
          id: string
          metadata: Json | null
          name: string
          plan_year: number | null
          type_extension: string | null
          type_network: string | null
          type_program: string | null
          type_snp: string | null
          updated_at: string
        }
        Insert: {
          carrier?: string | null
          cms_contract_number?: string | null
          cms_geo_segment?: string | null
          cms_plan_number?: string | null
          counties?: string[] | null
          created_at?: string
          id?: string
          metadata?: Json | null
          name: string
          plan_year?: number | null
          type_extension?: string | null
          type_network?: string | null
          type_program?: string | null
          type_snp?: string | null
          updated_at?: string
        }
        Update: {
          carrier?: string | null
          cms_contract_number?: string | null
          cms_geo_segment?: string | null
          cms_plan_number?: string | null
          counties?: string[] | null
          created_at?: string
          id?: string
          metadata?: Json | null
          name?: string
          plan_year?: number | null
          type_extension?: string | null
          type_network?: string | null
          type_program?: string | null
          type_snp?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          completed_date: string | null
          contact_id: string
          created_at: string
          description: string | null
          id: string
          is_complete: boolean
          priority: string
          reminder_date: string
          reminder_source: string | null
          reminder_type: string | null
          title: string
          updated_at: string
        }
        Insert: {
          completed_date?: string | null
          contact_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_complete?: boolean
          priority?: string
          reminder_date: string
          reminder_source?: string | null
          reminder_type?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          completed_date?: string | null
          contact_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_complete?: boolean
          priority?: string
          reminder_date?: string
          reminder_source?: string | null
          reminder_type?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'reminders_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'contacts'
            referencedColumns: ['id']
          },
        ]
      }
      tag_categories: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          parent_category_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          parent_category_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          parent_category_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'tag_categories_parent_category_id_fkey'
            columns: ['parent_category_id']
            isOneToOne: false
            referencedRelation: 'tag_categories'
            referencedColumns: ['id']
          },
        ]
      }
      tags: {
        Row: {
          category_id: string
          created_at: string
          icon_url: string | null
          id: string
          is_active: boolean
          label: string
          metadata: Json | null
        }
        Insert: {
          category_id: string
          created_at?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean
          label: string
          metadata?: Json | null
        }
        Update: {
          category_id?: string
          created_at?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean
          label?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: 'tags_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'tag_categories'
            referencedColumns: ['id']
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
