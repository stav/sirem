import React, { useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Database } from '@/lib/supabase'

type Reminder = Database['public']['Tables']['reminders']['Row']

interface ReminderFormData {
  title: string
  description: string
  reminder_date: string
  priority: 'low' | 'medium' | 'high'
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
  onCancel
}: ReminderFormProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onCancel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={e => {
        if (e.target === e.currentTarget) {
          onCancel()
        }
      }}
    >
      <Card className="w-full max-w-md" ref={modalRef}>
        <CardHeader>
          <CardTitle>
            {editingReminder ? 'Edit Reminder' : 'Add New Reminder'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => onFormDataChange({...formData, title: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => onFormDataChange({...formData, description: e.target.value})}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="reminder_date">Due Date</Label>
              <Input
                id="reminder_date"
                type="date"
                value={formData.reminder_date}
                onChange={(e) => onFormDataChange({...formData, reminder_date: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: 'low' | 'medium' | 'high') => 
                  onFormDataChange({...formData, priority: value})
                }
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
            <div className="flex space-x-2">
              <Button type="submit" className="flex-1">
                {editingReminder ? 'Update' : 'Create'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 
