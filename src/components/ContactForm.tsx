import React, { useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X } from 'lucide-react'
import type { Database } from '@/lib/supabase'

type Contact = Database['public']['Tables']['contacts']['Row']

interface ContactFormData {
  first_name: string
  last_name: string
  phone: string
  email: string
  notes: string
  birthdate: string
  status: string
}

interface ContactFormProps {
  isOpen: boolean
  editingContact: Contact | null
  formData: ContactFormData
  onFormDataChange: (data: ContactFormData) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  isLoading?: boolean
}

export default function ContactForm({
  isOpen,
  editingContact,
  formData,
  onFormDataChange,
  onSubmit,
  onCancel,
  isLoading = false
}: ContactFormProps) {
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
      <Card className="w-full max-w-md max-h-[90vh] flex flex-col" ref={modalRef}>
        <CardHeader className="relative flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 h-12 w-12 p-0"
            onClick={onCancel}
          >
            <X className="h-8 w-8" />
          </Button>
          <CardTitle>
            {editingContact ? 'Edit Contact' : 'Add New Contact'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          <form onSubmit={onSubmit} className="space-y-4 pb-4">
            {editingContact && (
              <div className="text-sm text-muted-foreground mb-4 p-3 bg-muted/50 rounded-md">
                <p>Editing contact: <strong>{editingContact.first_name} {editingContact.last_name}</strong></p>
                <p className="text-xs mt-1">Last updated: {new Date(editingContact.updated_at).toLocaleString()}</p>
              </div>
            )}
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => onFormDataChange({...formData, first_name: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => onFormDataChange({...formData, last_name: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => onFormDataChange({...formData, phone: e.target.value})}
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => onFormDataChange({...formData, email: e.target.value})}
                placeholder="john.doe@example.com"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => onFormDataChange({...formData, notes: e.target.value})}
                rows={3}
                placeholder="Add any additional notes about this contact..."
              />
            </div>
            <div>
              <Label htmlFor="birthdate">Birthday</Label>
              <Input
                id="birthdate"
                type="date"
                value={formData.birthdate}
                onChange={(e) => onFormDataChange({...formData, birthdate: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => onFormDataChange({...formData, status: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">🆕 New</SelectItem>
                  <SelectItem value="Client">✅ Client</SelectItem>
                  <SelectItem value="Contacted">📞 Contacted</SelectItem>
                  <SelectItem value="Engaged">🤝 Engaged</SelectItem>
                  <SelectItem value="No response">❌ No response</SelectItem>
                  <SelectItem value="Already enrolled">🎓 Already enrolled</SelectItem>
                  <SelectItem value="Not interested">😐 Not interested</SelectItem>
                  <SelectItem value="Not eligible">🚫 Not eligible</SelectItem>
                  <SelectItem value="Other">📝 Other</SelectItem>
                  <SelectItem value="Loyal">💎 Loyal</SelectItem>
                  <SelectItem value="Retained">🔄 Retained</SelectItem>
                  <SelectItem value="Too expensive">💰 Too expensive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2 pt-4 border-t">
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? 'Saving...' : (editingContact ? 'Update' : 'Create')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 
