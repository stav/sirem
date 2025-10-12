'use client'

import React, { useState } from 'react'
import Navigation from '@/components/Navigation'
import { useTagsPage } from '@/hooks/useTagsPage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Tag as TagIcon, FolderOpen } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import TagForm from '@/components/TagForm'
import CategoryForm from '@/components/CategoryForm'
import type { Database } from '@/lib/supabase-types'

type Tag = Database['public']['Tables']['tags']['Row']
type TagCategory = Database['public']['Tables']['tag_categories']['Row']

interface TagWithCategory extends Tag {
  tag_categories: TagCategory
}

export default function TagsPage() {
  const { tags, categories, loading, createCategory, deleteCategory, updateCategory, deleteTag, fetchTags } = useTagsPage()
  const { toast } = useToast()
  
  // Categories state for real-time updates
  
  // Force component to re-render when categories change
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Force refresh when categories change
  React.useEffect(() => {
    setRefreshKey(prev => prev + 1)
  }, [categories.length])

  const [showTagForm, setShowTagForm] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingTag, setEditingTag] = useState<TagWithCategory | null>(null)
  const [editingCategory, setEditingCategory] = useState<TagCategory | null>(null)

  const handleAddTag = () => {
    setEditingTag(null)
    setShowTagForm(true)
  }

  const handleEditTag = (tag: TagWithCategory) => {
    setEditingTag(tag)
    setShowTagForm(true)
  }

  const handleDeleteTag = async (tagId: string, tagLabel: string) => {
    if (!confirm(`Are you sure you want to delete the tag "${tagLabel}"? This will remove it from all contacts.`)) {
      return
    }

    const success = await deleteTag(tagId)
    if (success) {
      toast({
        title: 'Tag deleted',
        description: `"${tagLabel}" was successfully deleted.`,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Error',
        description: 'Failed to delete tag. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleAddCategory = () => {
    setEditingCategory(null)
    setShowCategoryForm(true)
  }

  const handleEditCategory = (category: TagCategory) => {
    setEditingCategory(category)
    setShowCategoryForm(true)
  }

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    // Check if category has any tags
    const tagsInCategory = tags.filter((tag) => tag.category_id === categoryId)
    if (tagsInCategory.length > 0) {
      toast({
        title: 'Cannot delete category',
        description: `This category contains ${tagsInCategory.length} tag(s). Please delete or reassign the tags first.`,
        variant: 'destructive',
      })
      return
    }

    if (!confirm(`Are you sure you want to delete the category "${categoryName}"?`)) {
      return
    }

    const success = await deleteCategory(categoryId)
    if (success) {
      toast({
        title: 'Category deleted',
        description: `"${categoryName}" was successfully deleted.`,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Error',
        description: 'Failed to delete category. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const closeTagForm = () => {
    setShowTagForm(false)
    setEditingTag(null)
  }

  const closeCategoryForm = () => {
    setShowCategoryForm(false)
    setEditingCategory(null)
  }

  // Group tags by category
  const tagsByCategory = tags.reduce(
    (acc, tag) => {
      const categoryName = tag.tag_categories.name
      if (!acc[categoryName]) {
        acc[categoryName] = {
          category: tag.tag_categories,
          tags: [],
        }
      }
      acc[categoryName].tags.push(tag)
      return acc
    },
    {} as Record<string, { category: TagCategory; tags: TagWithCategory[] }>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation pageTitle="Tags" />
        <div className="p-6">
          <div className="mx-auto max-w-6xl">
            <div className="animate-pulse">
              <div className="mb-8 h-8 w-1/4 rounded bg-muted"></div>
              <div className="space-y-4">
                <div className="h-48 rounded bg-muted"></div>
                <div className="h-48 rounded bg-muted"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation pageTitle="Tags" />

      <div className="p-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Tag Management</h1>
              <p className="mt-2 text-muted-foreground">
                Organize your contacts with tags and categories
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddCategory} variant="outline">
                <FolderOpen className="mr-2 h-4 w-4" />
                New Category
              </Button>
              <Button onClick={handleAddTag}>
                <Plus className="mr-2 h-4 w-4" />
                New Tag
              </Button>
            </div>
          </div>

          {/* Categories Section */}
          <Card className="mb-6" key={refreshKey}>
            <CardHeader>
              <CardTitle>Tag Categories</CardTitle>
              <CardDescription>
                Categories help organize your tags into logical groups
              </CardDescription>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <FolderOpen className="mx-auto mb-3 h-12 w-12 opacity-50" />
                  <p>No categories yet. Create one to get started.</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {categories.map((category) => {
                    const tagCount = tags.filter((tag) => tag.category_id === category.id).length
                    return (
                      <Card key={category.id} className="relative">
                        <CardContent className="pt-4">
                          <div className="mb-2 flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-4 w-4 rounded-full"
                                style={{ backgroundColor: category.color || '#A9A9A9' }}
                              />
                              <span className="font-semibold">{category.name}</span>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditCategory(category)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteCategory(category.id, category.name)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {tagCount} {tagCount === 1 ? 'tag' : 'tags'}
                          </div>
                          {!category.is_active && (
                            <Badge variant="secondary" className="mt-2 text-xs">
                              Inactive
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags by Category Section */}
          <div className="space-y-6">
            {Object.keys(tagsByCategory).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <TagIcon className="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-50" />
                  <h3 className="mb-2 text-lg font-semibold">No tags yet</h3>
                  <p className="mb-4 text-muted-foreground">
                    Create your first tag to start organizing contacts
                  </p>
                  <Button onClick={handleAddTag}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Tag
                  </Button>
                </CardContent>
              </Card>
            ) : (
              Object.entries(tagsByCategory).map(([categoryName, { category, tags: categoryTags }]) => (
                <Card key={category.id}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: category.color || '#A9A9A9' }}
                      />
                      <CardTitle>{categoryName}</CardTitle>
                    </div>
                    <CardDescription>{categoryTags.length} tags in this category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {categoryTags.map((tag) => (
                        <div key={tag.id} className="group relative">
                          <Badge
                            variant="outline"
                            className="pr-16 text-sm"
                            style={{
                              borderColor: category.color || '#A9A9A9',
                              color: category.color || '#A9A9A9',
                              backgroundColor: `${category.color || '#A9A9A9'}10`,
                            }}
                          >
                            <TagIcon className="mr-1 h-3 w-3" />
                            {tag.label}
                            {!tag.is_active && (
                              <span className="ml-1 text-xs opacity-60">(inactive)</span>
                            )}
                          </Badge>
                          <div className="absolute right-1 top-1/2 flex -translate-y-1/2 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleEditTag(tag)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleDeleteTag(tag.id, tag.label)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Tag Form Modal */}
      {showTagForm && (
        <TagForm
          isOpen={showTagForm}
          onClose={closeTagForm}
          editingTag={editingTag}
          categories={categories}
          onTagCreated={fetchTags}
        />
      )}

      {/* Category Form Modal */}
      {showCategoryForm && (
        <CategoryForm
          isOpen={showCategoryForm}
          onClose={closeCategoryForm}
          editingCategory={editingCategory}
          categories={categories}
          onCreateCategory={createCategory}
          onUpdateCategory={updateCategory}
        />
      )}
    </div>
  )
}

