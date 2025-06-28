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
          first_name: string
          last_name: string
          email: string | null
          phone: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          first_name: string
          last_name: string
          email?: string | null
          phone?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          first_name?: string
          last_name?: string
          email?: string | null
          phone?: string | null
          notes?: string | null
        }
      }
      reminders: {
        Row: {
          id: string
          created_at: string
          contact_id: string
          title: string
          description: string | null
          due_date: string
          completed: boolean
          priority: 'low' | 'medium' | 'high'
        }
        Insert: {
          id?: string
          created_at?: string
          contact_id: string
          title: string
          description?: string | null
          due_date: string
          completed?: boolean
          priority?: 'low' | 'medium' | 'high'
        }
        Update: {
          id?: string
          created_at?: string
          contact_id?: string
          title?: string
          description?: string | null
          due_date?: string
          completed?: boolean
          priority?: 'low' | 'medium' | 'high'
        }
      }
    }
  }
} 
