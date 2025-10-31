import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase-types'

type Tag = Database['public']['Tables']['tags']['Row']
type TagCategory = Database['public']['Tables']['tag_categories']['Row']

export interface TagWithCategory extends Tag {
  tag_categories: TagCategory
}

/**
 * Fetches all active tags with their categories from the database
 * @returns Promise<TagWithCategory[]> Array of active tags with category information
 */
export const getAllTagsWithCategories = async (): Promise<TagWithCategory[]> => {
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
      .eq('is_active', true)
      .order('label', { ascending: true })

    if (error) {
      console.error('Error fetching tags:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching tags:', error)
    return []
  }
}

/**
 * Fetches all active tags from the database (legacy function for backward compatibility)
 * @returns Promise<Tag[]> Array of active tags
 */
export const getAllTags = async (): Promise<Tag[]> => {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('is_active', true)
      .order('label', { ascending: true })

    if (error) {
      console.error('Error fetching tags:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching tags:', error)
    return []
  }
}

/**
 * Gets tag labels from an array of tags
 * @param tags Array of tags
 * @returns Array of tag labels
 */
export const getTagLabels = (tags: Tag[]): string[] => {
  return tags.map((tag) => tag.label)
}
