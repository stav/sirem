import React, { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { User, Phone, Mail, Tag, Edit2 } from 'lucide-react'
import { formatPhoneNumber } from '@/lib/contact-utils'
import TagPicker from '@/components/TagPicker'
import type { Database } from '@/lib/supabase'

type Contact = Database['public']['Tables']['contacts']['Row']

type TagWithCategory = {
  id: string
  label: string
  category_id: string
  tag_categories: {
    id: string
    name: string
    color: string | null
  }
}

interface ContactBasicInfoProps {
  contact: Contact
  tags: TagWithCategory[]
  tagsLoading: boolean
  onTagsUpdatedWithData: (tags: TagWithCategory[]) => void
  onContactUpdated?: () => void
}

export default function ContactBasicInfo({ contact, tags, tagsLoading, onTagsUpdatedWithData }: ContactBasicInfoProps) {
  const [isEditingTags, setIsEditingTags] = useState(false)

  // Reset editing state when contact changes
  useEffect(() => {
    setIsEditingTags(false)
  }, [contact.id])

  return (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <Label className="text-muted-foreground text-sm font-medium">Full Name</Label>
        <div className="mt-1 flex items-center space-x-2">
          <User className="text-muted-foreground h-4 w-4" />
          <p className="text-base font-semibold">
            {[contact.prefix, contact.first_name, contact.middle_name, contact.last_name, contact.suffix]
              .filter(Boolean)
              .join(' ')}
          </p>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-muted-foreground text-sm font-medium">Tags</Label>
          <Button variant="ghost" size="sm" onClick={() => setIsEditingTags(!isEditingTags)} className="h-7 text-xs">
            <Edit2 className="mr-1 h-3 w-3" />
            {isEditingTags ? 'Done' : 'Edit'}
          </Button>
        </div>

        {isEditingTags ? (
          <TagPicker
            key={`tag-picker-${contact.id}`}
            contactId={contact.id}
            selectedTagIds={tags.map((t) => t.id)}
            onTagsChangeWithData={onTagsUpdatedWithData}
          />
        ) : (
          <>
            {tagsLoading ? (
              <div className="text-muted-foreground text-sm">Loading tags...</div>
            ) : tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
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
                    <Tag className="mr-1 h-3 w-3" />
                    {tag.label}
                    <span className="ml-1 text-xs opacity-60">({tag.tag_categories.name})</span>
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">No tags assigned</div>
            )}
          </>
        )}
      </div>

      {/* Contact Information */}
      <div className="space-y-3">
        <Label className="text-muted-foreground text-sm font-medium">Contact Information</Label>
        <div className="space-y-2">
          {contact.phone && (
            <div className="flex items-center space-x-2">
              <Phone className="text-muted-foreground h-4 w-4" />
              <span className="text-sm font-medium">Phone:</span>
              <span className="text-sm">{formatPhoneNumber(contact.phone)}</span>
            </div>
          )}
          {contact.email && (
            <div className="flex items-center space-x-2">
              <Mail className="text-muted-foreground h-4 w-4" />
              <span className="text-sm font-medium">Email:</span>
              <span className="text-sm">{contact.email}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
