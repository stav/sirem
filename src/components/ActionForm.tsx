import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import ModalForm from '@/components/ui/modal-form'
import DateInput from '@/components/ui/date-input'
import type { Database } from '@/lib/supabase'

type Action = Database['public']['Tables']['actions']['Row']

interface ActionFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  action: Action | null
  formData: ActionFormData
  setFormData: (data: ActionFormData) => void
  isSubmitting: boolean
}

export interface ActionFormData {
  title: string
  description: string
  tags: string
  start_date: string | null
  end_date: string | null
  completed_date: string | null
  status: string | null
  priority: string | null
  duration: number | null
  outcome: string | null
}

const priorities = [
  { value: 'none', label: 'None' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

export default function ActionForm({
  isOpen,
  onClose,
  onSubmit,
  action,
  formData,
  setFormData,
  isSubmitting,
}: ActionFormProps) {
  const isEditing = !!action

  return (
    <ModalForm
      isOpen={isOpen}
      onCancel={onClose}
      onSubmit={onSubmit}
      title={isEditing ? 'Edit Action' : 'Add Action'}
      isLoading={isSubmitting}
    >
      <div className="space-y-4">
        {/* Title */}
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter action title"
            required
          />
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter action description"
            rows={3}
          />
        </div>

        {/* Outcome */}
        <div>
          <Label htmlFor="outcome">Outcome</Label>
          <Textarea
            id="outcome"
            value={formData.outcome || ''}
            onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
            placeholder="Enter the outcome of this action"
            rows={2}
          />
        </div>

        {/* Tags */}
        <div>
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="Enter space-separated tags (e.g., medicare consultation called)"
          />
        </div>

        {/* Priority */}
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={formData.priority || 'none'}
            onValueChange={(value) => {
              let priority: 'low' | 'medium' | 'high' | null = null
              if (value === 'low' || value === 'medium' || value === 'high') priority = value
              setFormData({ ...formData, priority })
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              {priorities.map((priority) => (
                <SelectItem key={priority.label} value={priority.value}>
                  {priority.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Duration (in hours) */}
        <div>
          <Label htmlFor="duration">Duration (hours)</Label>
          <Input
            id="duration"
            type="number"
            step="0.5"
            min="0"
            value={formData.duration || ''}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value ? parseFloat(e.target.value) : null })}
            placeholder="Enter duration in hours (e.g., 1.5)"
          />
        </div>

        {/* Start Date */}
        <div>
          <DateInput
            id="start_date"
            label="Start Date"
            value={formData.start_date || ''}
            onChange={(value) => setFormData({ ...formData, start_date: value })}
            placeholder="Select start date"
          />
        </div>

        {/* End Date */}
        <div>
          <DateInput
            id="end_date"
            label="End Date"
            value={formData.end_date || ''}
            onChange={(value) => setFormData({ ...formData, end_date: value })}
            placeholder="Select end date"
          />
        </div>

        {/* Completed Date */}
        <div>
          <DateInput
            id="completed_date"
            label="Completed Date"
            value={formData.completed_date || ''}
            onChange={(value) => setFormData({ ...formData, completed_date: value })}
            placeholder="Select completed date"
          />
        </div>
      </div>
    </ModalForm>
  )
}
