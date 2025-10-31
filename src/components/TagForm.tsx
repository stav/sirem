'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useTags } from '@/hooks/useTags'
import { useToast } from '@/hooks/use-toast'
import type { Database } from '@/lib/supabase-types'

type Tag = Database['public']['Tables']['tags']['Row']
type TagCategory = Database['public']['Tables']['tag_categories']['Row']

interface TagWithCategory extends Tag {
  tag_categories: TagCategory
}

interface TagFormProps {
  isOpen: boolean
  onClose: () => void
  editingTag: TagWithCategory | null
  categories: TagCategory[]
  onTagCreated?: () => void
}

export default function TagForm({ isOpen, onClose, editingTag, categories, onTagCreated }: TagFormProps) {
  const { createTag, updateTag } = useTags()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    label: '',
    category_id: '',
    icon_url: '',
    is_active: true,
  })

  useEffect(() => {
    if (editingTag) {
      setFormData({
        label: editingTag.label,
        category_id: editingTag.category_id,
        icon_url: editingTag.icon_url || '',
        is_active: editingTag.is_active,
      })
    } else {
      setFormData({
        label: '',
        category_id: categories.length > 0 ? categories[0].id : '',
        icon_url: '',
        is_active: true,
      })
    }
  }, [editingTag, categories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!formData.label.trim()) {
        toast({
          title: 'Validation error',
          description: 'Tag label is required.',
          variant: 'destructive',
        })
        return
      }

      if (!formData.category_id) {
        toast({
          title: 'Validation error',
          description: 'Please select a category.',
          variant: 'destructive',
        })
        return
      }

      const success = editingTag ? await updateTag(editingTag.id, formData) : await createTag(formData)

      if (success) {
        toast({
          title: editingTag ? 'Tag updated' : 'Tag created',
          description: `"${formData.label}" was successfully ${editingTag ? 'updated' : 'created'}.`,
        })
        onClose()
        // Refresh the tags list if callback provided
        if (onTagCreated) {
          onTagCreated()
        }
      } else {
        toast({
          title: 'Error',
          description: `Failed to ${editingTag ? 'update' : 'create'} tag. Please try again.`,
          variant: 'destructive',
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingTag ? 'Edit Tag' : 'Create New Tag'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tag Label */}
          <div>
            <Label htmlFor="label">Tag Label *</Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="e.g., Medicare Client, Referral Partner"
              required
            />
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color || '#A9A9A9' }} />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Icon URL (Optional) */}
          <div>
            <Label htmlFor="icon_url">Icon URL (Optional)</Label>
            <Input
              id="icon_url"
              value={formData.icon_url}
              onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Active</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingTag ? 'Update Tag' : 'Create Tag'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
