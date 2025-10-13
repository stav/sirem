import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase-types'

type Tag = Database['public']['Tables']['tags']['Row']
type TagCategory = Database['public']['Tables']['tag_categories']['Row']

interface TagWithCategory extends Tag {
  tag_categories: TagCategory
}

interface CategoryForm {
  name: string
  color?: string
  is_active?: boolean
  parent_category_id?: string
}

export function useTagsPage() {
  const [tags, setTags] = useState<TagWithCategory[]>([])
  const [categories, setCategories] = useState<TagCategory[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTags = useCallback(async () => {
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
  }, [])

  const fetchCategories = useCallback(async () => {
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
  }, [])

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

  const updateCategory = async (categoryId: string, categoryData: CategoryForm) => {
    try {
      const { error } = await supabase
        .from('tag_categories')
        .update({
          name: categoryData.name,
          color: categoryData.color || '#A9A9A9',
          is_active: categoryData.is_active ?? true,
          parent_category_id: categoryData.parent_category_id,
        })
        .eq('id', categoryId)

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

  const deleteTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId)

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

  const deleteCategory = async (categoryId: string) => {
    try {
      const { error } = await supabase
        .from('tag_categories')
        .delete()
        .eq('id', categoryId)

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

  useEffect(() => {
    fetchTags()
    fetchCategories()
  }, [fetchTags, fetchCategories])

  return {
    tags,
    categories,
    loading,
    createCategory,
    updateCategory,
    deleteTag,
    deleteCategory,
    fetchTags,
    fetchCategories,
  }
}
