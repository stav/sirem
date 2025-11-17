import { Suspense } from 'react'
import TagsClient from '@/components/TagsClient'
import TagsLoading from '@/components/loading/TagsLoading'
import { fetchAllRecordsServer } from '@/lib/database-server'
import type { Database } from '@/lib/supabase-types'
import type { TagWithCategory } from '@/components/TagsClient'

type TagCategory = Database['public']['Tables']['tag_categories']['Row']

async function TagsData() {
  // Fetch tags with categories and categories separately
  const [tags, categories] = await Promise.all([
    fetchAllRecordsServer<TagWithCategory>(
      'tags',
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
      `,
      'label',
      true
    ),
    fetchAllRecordsServer<TagCategory>('tag_categories', '*', 'name', true),
  ])

  return <TagsClient initialTags={tags} initialCategories={categories} />
}

export default function TagsPage() {
  return (
    <Suspense fallback={<TagsLoading />}>
      <TagsData />
    </Suspense>
  )
}
