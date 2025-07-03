import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import ModalForm from '@/components/ui/modal-form'
import DateInput from '@/components/ui/date-input'
import type { Database } from '@/lib/supabase'

type Reminder = Database['public']['Tables']['reminders']['Row']

interface ReminderFormData {
  title: string
  description: string
  reminder_date: string
  priority: 'low' | 'medium' | 'high'
  reminder_type: string
  completed_date: string
}

interface ReminderFormProps {
  isOpen: boolean
  editingReminder: Reminder | null
  formData: ReminderFormData
  onFormDataChange: (data: ReminderFormData) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}

export default function ReminderForm({
  isOpen,
  editingReminder,
  formData,
  onFormDataChange,
  onSubmit,
  onCancel,
}: ReminderFormProps) {
  const title = editingReminder ? 'Edit Reminder' : 'Add New Reminder'
  const submitText = editingReminder ? 'Update' : 'Create'

  return (
    <ModalForm isOpen={isOpen} title={title} onSubmit={onSubmit} onCancel={onCancel} submitText={submitText}>
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => onFormDataChange({ ...formData, title: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>
      <DateInput
        id="reminder_date"
        label="Due Date"
        value={formData.reminder_date}
        onChange={(value) => onFormDataChange({ ...formData, reminder_date: value })}
        required
      />
      <DateInput
        id="completed_date"
        label="Completed Date (optional)"
        value={formData.completed_date}
        onChange={(value) => onFormDataChange({ ...formData, completed_date: value })}
        placeholder="Leave empty if not completed"
      />
      <div>
        <Label htmlFor="priority">Priority</Label>
        <Select
          value={formData.priority}
          onValueChange={(value: 'low' | 'medium' | 'high') => onFormDataChange({ ...formData, priority: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="reminder_type">Badges (space-separated)</Label>
        <Input
          id="reminder_type"
          value={formData.reminder_type}
          onChange={(e) => onFormDataChange({ ...formData, reminder_type: e.target.value })}
          placeholder="e.g., urgent follow-up medical"
        />
      </div>
    </ModalForm>
  )
}
