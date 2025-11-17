import type { Database } from '@/lib/supabase'

export type ManageContact = Database['public']['Tables']['contacts']['Row'] & {
  addresses?: Database['public']['Tables']['addresses']['Row'][]
  contact_roles?: Database['public']['Tables']['contact_roles']['Row'][]
  contact_tags?: {
    tags: {
      id: string
      label: string
      tag_categories: {
        id: string
        name: string
      }
    }
  }[]
}

export type ManageAction = Database['public']['Tables']['actions']['Row']

