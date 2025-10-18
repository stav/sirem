import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { getAllRoleTypes } from '@/lib/role-config'
import { getAllTagsWithCategories, type TagWithCategory } from '@/lib/tag-utils'

interface FilterHelperProps {
  isOpen: boolean
  onAddFilter: (filterText: string) => void
}

export default function FilterHelper({ isOpen, onAddFilter }: FilterHelperProps) {
  const [statuses, setStatuses] = useState<string[]>([])
  const [tags, setTags] = useState<TagWithCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [tagsLoading, setTagsLoading] = useState(false)

  // Get available role types
  const roleTypes = getAllRoleTypes()

  // Fetch unique statuses and tags from the database
  useEffect(() => {
    if (isOpen) {
      fetchUniqueStatuses()
      fetchTags()
    }
  }, [isOpen])

  const fetchUniqueStatuses = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('status')
        .not('status', 'is', null)
        .not('status', 'eq', '')

      if (error) {
        console.error('Error fetching statuses:', error)
        return
      }

      // Extract unique statuses and sort them
      const uniqueStatuses = [
        ...new Set(data.map((item) => item.status).filter((status): status is string => status !== null)),
      ].sort()
      setStatuses(uniqueStatuses)
    } catch (error) {
      console.error('Error fetching statuses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusClick = (status: string) => {
    onAddFilter(`s:${status.toLowerCase()}`)
  }

  const fetchTags = async () => {
    setTagsLoading(true)
    try {
      const fetchedTags = await getAllTagsWithCategories()
      setTags(fetchedTags)
    } catch (error) {
      console.error('Error fetching tags:', error)
    } finally {
      setTagsLoading(false)
    }
  }

  const handleRoleClick = (roleType: string) => {
    onAddFilter(`r:${roleType.toLowerCase()}`)
  }

  const handleTagClick = (tagLabel: string) => {
    onAddFilter(`t:${tagLabel.toLowerCase()}`)
  }

  if (!isOpen) return null

  return (
    <div className="bg-muted/50 mt-2 rounded-md border p-3">
      <div className="mb-3 text-sm font-medium text-gray-700">Quick Filters:</div>

      {/* Status Filters */}
      <div className="mb-3">
        <div className="mb-2 text-xs font-medium text-gray-600">Status:</div>
        {loading ? (
          <div className="text-sm text-gray-500">Loading statuses...</div>
        ) : statuses.length === 0 ? (
          <div className="text-sm text-gray-500">No statuses found</div>
        ) : (
          <div className="flex flex-wrap gap-1">
            {statuses.map((status) => (
              <Button
                key={status}
                variant="outline"
                size="sm"
                onClick={() => handleStatusClick(status)}
                className="cursor-pointer text-xs"
              >
                {status}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Role Filters */}
      <div className="mb-3">
        <div className="mb-2 text-xs font-medium text-gray-600">Roles:</div>
        <div className="flex flex-wrap gap-1">
          {roleTypes.map((roleType) => (
            <Button
              key={roleType}
              variant="outline"
              size="sm"
              onClick={() => handleRoleClick(roleType)}
              className="cursor-pointer text-xs"
            >
              {roleType.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </div>

      {/* Tag Filters */}
      <div>
        <div className="mb-2 text-xs font-medium text-gray-600">Tags:</div>
        {tagsLoading ? (
          <div className="text-sm text-gray-500">Loading tags...</div>
        ) : tags.length === 0 ? (
          <div className="text-sm text-gray-500">No tags found</div>
        ) : (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Button
                key={tag.id}
                variant="outline"
                size="sm"
                onClick={() => handleTagClick(tag.label)}
                className="cursor-pointer text-xs"
                style={{
                  borderColor: tag.tag_categories.color || '#A9A9A9',
                  color: tag.tag_categories.color || '#A9A9A9',
                  backgroundColor: `${tag.tag_categories.color || '#A9A9A9'}10`,
                }}
              >
                {tag.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
