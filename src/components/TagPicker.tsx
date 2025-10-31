'use client'

import React, { useState, useEffect, memo } from 'react'
import { X, Plus, Tag as TagIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useTags } from '@/hooks/useTags'
import type { Database } from '@/lib/supabase-types'

type Tag = Database['public']['Tables']['tags']['Row']
type TagCategory = Database['public']['Tables']['tag_categories']['Row']

interface TagWithCategory extends Tag {
  tag_categories: TagCategory
}

interface TagPickerProps {
  contactId?: string
  selectedTagIds: string[]
  onTagsChange: (tagIds: string[]) => void
  className?: string
}

function TagPicker({ contactId, selectedTagIds, onTagsChange, className }: TagPickerProps) {
  // Only fetch tags if we have a contactId to prevent unnecessary API calls
  const { tags, categories, loading, assignTagToContact, removeTagFromContact } = useTags()
  const [open, setOpen] = useState(false)
  const [selectedTags, setSelectedTags] = useState<TagWithCategory[]>([])

  // Update selected tags when tags or selectedTagIds change
  useEffect(() => {
    if (tags.length > 0) {
      const selected = tags.filter((tag) => selectedTagIds.includes(tag.id))
      setSelectedTags(selected)
    }
  }, [tags, selectedTagIds])

  // Don't render if no contactId provided
  if (!contactId) {
    return <div className="text-muted-foreground text-sm">No contact selected</div>
  }

  const handleSelectTag = async (tag: TagWithCategory) => {
    const isAlreadySelected = selectedTagIds.includes(tag.id)

    if (isAlreadySelected) {
      // Remove tag
      const newTagIds = selectedTagIds.filter((id) => id !== tag.id)
      onTagsChange(newTagIds)

      // If contactId is provided, update the database immediately
      if (contactId) {
        await removeTagFromContact(contactId, tag.id)
      }
    } else {
      // Add tag
      const newTagIds = [...selectedTagIds, tag.id]
      onTagsChange(newTagIds)

      // If contactId is provided, update the database immediately
      if (contactId) {
        await assignTagToContact(contactId, tag.id)
      }
    }
  }

  const handleRemoveTag = async (tagId: string) => {
    const newTagIds = selectedTagIds.filter((id) => id !== tagId)
    onTagsChange(newTagIds)

    // If contactId is provided, update the database immediately
    if (contactId) {
      await removeTagFromContact(contactId, tagId)
    }
  }

  // Group tags by category
  const tagsByCategory = tags.reduce(
    (acc, tag) => {
      const categoryName = tag.tag_categories.name
      if (!acc[categoryName]) {
        acc[categoryName] = []
      }
      acc[categoryName].push(tag)
      return acc
    },
    {} as Record<string, TagWithCategory[]>
  )

  if (loading) {
    return <div className="text-muted-foreground text-sm">Loading tags...</div>
  }

  return (
    <div className={className}>
      {/* Selected Tags Display */}
      <div className="mb-2 flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="outline"
            className="text-xs"
            style={{
              borderColor: tag.tag_categories.color || '#A9A9A9',
              color: tag.tag_categories.color || '#A9A9A9',
              backgroundColor: `${tag.tag_categories.color || '#A9A9A9'}10`,
            }}
          >
            <TagIcon className="mr-1 h-3 w-3" />
            {tag.label}
            <button type="button" onClick={() => handleRemoveTag(tag.id)} className="ml-1 rounded-sm hover:bg-black/10">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      {/* Tag Selection Popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="w-full justify-start">
            <Plus className="mr-2 h-4 w-4" />
            Add Tags
          </Button>
        </PopoverTrigger>
        <PopoverContent className="z-[70] w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandList>
              <CommandEmpty>No tags found.</CommandEmpty>
              {Object.entries(tagsByCategory).map(([categoryName, categoryTags]) => {
                const category = categories.find((c) => c.name === categoryName)
                return (
                  <CommandGroup key={categoryName} heading={categoryName}>
                    {categoryTags
                      .filter((tag) => tag.is_active)
                      .map((tag) => {
                        const isSelected = selectedTagIds.includes(tag.id)
                        return (
                          <CommandItem
                            key={tag.id}
                            value={`${tag.label} ${categoryName}`}
                            onSelect={() => handleSelectTag(tag)}
                          >
                            <div className="flex w-full items-center justify-between">
                              <span className="flex items-center">
                                <div
                                  className="mr-2 h-3 w-3 rounded-full"
                                  style={{ backgroundColor: category?.color || '#A9A9A9' }}
                                />
                                {tag.label}
                              </span>
                              {isSelected && (
                                <Badge variant="secondary" className="text-xs">
                                  Selected
                                </Badge>
                              )}
                            </div>
                          </CommandItem>
                        )
                      })}
                  </CommandGroup>
                )
              })}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default memo(TagPicker)
