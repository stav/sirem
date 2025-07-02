import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import ModalForm from '@/components/ui/modal-form'
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
  medicare_beneficiary_id: string
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
  const title = editingContact 
    ? `${editingContact.first_name} ${editingContact.last_name}`
    : 'Add New Contact'
  const submitText = editingContact ? 'Update' : 'Create'

  const editingInfo = editingContact && (
    <div className="text-xs text-muted-foreground mb-4">
      Last updated: {new Date(editingContact.updated_at).toLocaleString()}
    </div>
  )

  return (
    <ModalForm
      isOpen={isOpen}
      title={title}
      onSubmit={onSubmit}
      onCancel={onCancel}
      isLoading={isLoading}
      submitText={submitText}
      editingInfo={editingInfo}
    >
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
        <Label htmlFor="medicare_beneficiary_id">Medicare Beneficiary ID (MBI)</Label>
        <Input
          id="medicare_beneficiary_id"
          value={formData.medicare_beneficiary_id}
          onChange={(e) => {
            // Only allow alphanumeric characters and hyphens
            const value = e.target.value.replace(/[^A-Z0-9-]/gi, '');
            onFormDataChange({...formData, medicare_beneficiary_id: value})
          }}
          placeholder="1EG4-TE5-MK73"
          maxLength={13}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Format: XXXX-XXXX-XXXX (11 characters, hyphens optional)
        </p>
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
    </ModalForm>
  )
} 
