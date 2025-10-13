import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase-types'
import { logger } from '@/lib/logger'
import type { Json } from '@/lib/supabase-types'

type Tag = Database['public']['Tables']['tags']['Row']
type TagCategory = Database['public']['Tables']['tag_categories']['Row']

interface TagWithCategory extends Tag {
  tag_categories: TagCategory
}

interface TagForm {
  label: string
  category_id: string
  icon_url?: string
  metadata?: Json
  is_active?: boolean
}

interface CategoryForm {
  name: string
  color?: string
  is_active?: boolean
  parent_category_id?: string | null
}

export function useTags() {
  const [tags, setTags] = useState<TagWithCategory[]>([])
  const [categories, setCategories] = useState<TagCategory[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select(
          `
          *,
          tag_categories (
            id,
            name,
            color,
            is_active,
            parent_category_id,
            created_at
          )
        `
        )
        .order('label', { ascending: true })

      if (error) {
        console.error('Error fetching tags:', error)
        return
      }

      setTags(data || [])
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('tag_categories')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching tag categories:', error)
        return
      }

      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching tag categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const createTag = async (tagData: TagForm) => {
    try {
      const { error } = await supabase
        .from('tags')
        .insert({
          label: tagData.label,
          category_id: tagData.category_id,
          icon_url: tagData.icon_url,
          metadata: tagData.metadata,
          is_active: tagData.is_active ?? true,
        })
        .select()

      if (error) {
        console.error('Error creating tag:', error)
        return false
      }

      await fetchTags()
      return true
    } catch (error) {
      console.error('Error creating tag:', error)
      return false
    }
  }

  const updateTag = async (tagId: string, tagData: Partial<TagForm>) => {
    try {
      const { error } = await supabase.from('tags').update(tagData).eq('id', tagId)

      if (error) {
        console.error('Error updating tag:', error)
        return false
      }

      await fetchTags()
      return true
    } catch (error) {
      console.error('Error updating tag:', error)
      return false
    }
  }

  const deleteTag = async (tagId: string) => {
    try {
      const { error } = await supabase.from('tags').delete().eq('id', tagId)

      if (error) {
        console.error('Error deleting tag:', error)
        return false
      }

      await fetchTags()
      return true
    } catch (error) {
      console.error('Error deleting tag:', error)
      return false
    }
  }

  const createCategory = async (categoryData: CategoryForm) => {
    try {
      const { error } = await supabase
        .from('tag_categories')
        .insert({
          name: categoryData.name,
          color: categoryData.color || '#A9A9A9',
          is_active: categoryData.is_active ?? true,
          parent_category_id: categoryData.parent_category_id,
        })
        .select()

      if (error) {
        console.error('Error creating category:', error)
        return false
      }

      await fetchCategories()
      return true
    } catch (error) {
      console.error('Error creating category:', error)
      return false
    }
  }

  const updateCategory = async (categoryId: string, categoryData: Partial<CategoryForm>) => {
    try {
      const { error } = await supabase.from('tag_categories').update(categoryData).eq('id', categoryId)

      if (error) {
        console.error('Error updating category:', error)
        return false
      }

      await fetchCategories()
      return true
    } catch (error) {
      console.error('Error updating category:', error)
      return false
    }
  }

  const deleteCategory = async (categoryId: string) => {
    try {
      const { error } = await supabase.from('tag_categories').delete().eq('id', categoryId)

      if (error) {
        console.error('Error deleting category:', error)
        return false
      }

      await fetchCategories()
      return true
    } catch (error) {
      console.error('Error deleting category:', error)
      return false
    }
  }

  const assignTagToContact = async (contactId: string, tagId: string, metadata?: Json) => {
    try {
      const { error } = await supabase.from('contact_tags').upsert(
        {
          contact_id: contactId,
          tag_id: tagId,
          metadata: metadata,
        },
        { onConflict: 'contact_id,tag_id' }
      )

      if (error) {
        console.error('Error assigning tag to contact:', error)
        return false
      }

      // Log the tag assignment
      try {
        // Get contact name and tag name for logging
        const [contactResult, tagResult] = await Promise.all([
          supabase.from('contacts').select('first_name, last_name').eq('id', contactId).single(),
          supabase.from('tags').select('label').eq('id', tagId).single()
        ])

        if (contactResult.data && tagResult.data) {
          const contactName = `${contactResult.data.first_name} ${contactResult.data.last_name}`
          const tagName = tagResult.data.label
          logger.tagAdded(contactName, tagName, contactId)
        }
      } catch (logError) {
        console.error('Error logging tag assignment:', logError)
      }

      return true
    } catch (error) {
      console.error('Error assigning tag to contact:', error)
      return false
    }
  }

  const removeTagFromContact = async (contactId: string, tagId: string) => {
    try {
      // Get contact name and tag name for logging before deletion
      let contactName = 'Unknown Contact'
      let tagName = 'Unknown Tag'
      
      try {
        const [contactResult, tagResult] = await Promise.all([
          supabase.from('contacts').select('first_name, last_name').eq('id', contactId).single(),
          supabase.from('tags').select('label').eq('id', tagId).single()
        ])

        if (contactResult.data && tagResult.data) {
          contactName = `${contactResult.data.first_name} ${contactResult.data.last_name}`
          tagName = tagResult.data.label
        }
      } catch (logError) {
        console.error('Error getting contact/tag info for logging:', logError)
      }

      const { error } = await supabase
        .from('contact_tags')
        .delete()
        .eq('contact_id', contactId)
        .eq('tag_id', tagId)

      if (error) {
        console.error('Error removing tag from contact:', error)
        return false
      }

      // Log the tag removal
      logger.tagRemoved(contactName, tagName, contactId)

      return true
    } catch (error) {
      console.error('Error removing tag from contact:', error)
      return false
    }
  }

  const getContactTags = async (contactId: string): Promise<TagWithCategory[]> => {
    try {
      const { data, error } = await supabase
        .from('contact_tags')
        .select(
          `
          tag_id,
          tags!inner(
            id,
            label,
            category_id,
            icon_url,
            metadata,
            is_active,
            created_at,
            tag_categories!inner(
              id,
              name,
              color,
              is_active,
              parent_category_id,
              created_at
            )
          )
        `
        )
        .eq('contact_id', contactId)

      if (error) {
        console.error('Error fetching contact tags:', error)
        return []
      }

      // Transform the data to match TagWithCategory structure
      return (
        (data as Array<{ tags: TagWithCategory }>)?.map((item) => ({
          ...item.tags,
          tag_categories: item.tags.tag_categories,
        })) || []
      )
    } catch (error) {
      console.error('Error fetching contact tags:', error)
      return []
    }
  }

  useEffect(() => {
    fetchTags()
    fetchCategories()
  }, [])

  return {
    tags,
    categories,
    loading,
    fetchTags,
    fetchCategories,
    createTag,
    updateTag,
    deleteTag,
    createCategory,
    updateCategory,
    deleteCategory,
    assignTagToContact,
    removeTagFromContact,
    getContactTags,
  }
}

