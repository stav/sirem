'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import type { Database } from '@/lib/supabase-types'

type TagCategory = Database['public']['Tables']['tag_categories']['Row']

interface CategoryForm {
  name: string
  color?: string
  is_active?: boolean
  parent_category_id?: string
}

interface CategoryFormProps {
  isOpen: boolean
  onClose: () => void
  editingCategory: TagCategory | null
  categories: TagCategory[]
  onCreateCategory?: (categoryData: CategoryForm) => Promise<boolean>
  onUpdateCategory?: (categoryId: string, categoryData: CategoryForm) => Promise<boolean>
}

const DEFAULT_COLORS = [
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Green
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#A9A9A9', // Gray
]

export default function CategoryForm({ isOpen, onClose, editingCategory, categories, onCreateCategory, onUpdateCategory }: CategoryFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    is_active: true,
  })

  useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name,
        color: editingCategory.color || '#3B82F6',
        is_active: editingCategory.is_active,
      })
    } else {
      setFormData({
        name: '',
        color: '#3B82F6',
        is_active: true,
      })
    }
  }, [editingCategory])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!formData.name.trim()) {
        toast({
          title: 'Validation error',
          description: 'Category name is required.',
          variant: 'destructive',
        })
        return
      }

      // Check for duplicate name
      const duplicate = categories.find(
        (cat) => cat.name.toLowerCase() === formData.name.toLowerCase() && cat.id !== editingCategory?.id
      )

      if (duplicate) {
        toast({
          title: 'Validation error',
          description: 'A category with this name already exists.',
          variant: 'destructive',
        })
        return
      }

      const success = editingCategory
        ? onUpdateCategory 
          ? await onUpdateCategory(editingCategory.id, formData)
          : false
        : onCreateCategory 
          ? await onCreateCategory(formData)
          : false

      if (success) {
        toast({
          title: editingCategory ? 'Category updated' : 'Category created',
          description: `"${formData.name}" was successfully ${editingCategory ? 'updated' : 'created'}.`,
        })
        onClose()
      } else {
        toast({
          title: 'Error',
          description: `Failed to ${editingCategory ? 'update' : 'create'} category. The name "${formData.name}" may already exist.`,
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
          <DialogTitle>{editingCategory ? 'Edit Category' : 'Create New Category'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Name */}
          <div>
            <Label htmlFor="name">Category Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Client Type, Lead Source"
              required
            />
          </div>

          {/* Color Picker */}
          <div>
            <Label>Category Color</Label>
            <div className="mt-2 grid grid-cols-5 gap-2">
              {DEFAULT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`h-10 w-10 rounded-md border-2 transition-all hover:scale-110 ${
                    formData.color === color ? 'border-foreground ring-2 ring-foreground ring-offset-2' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Label htmlFor="custom-color" className="whitespace-nowrap">
                Custom:
              </Label>
              <Input
                id="custom-color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="h-10 w-20"
              />
              <span className="text-sm text-muted-foreground">{formData.color}</span>
            </div>
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
              {isSubmitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

