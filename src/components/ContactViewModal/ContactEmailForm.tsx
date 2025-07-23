import React, { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import ModalForm from '@/components/ui/modal-form'
import { Send } from 'lucide-react'
import { formatPhoneNumber } from '@/lib/contact-utils'
import { useToast } from '@/hooks/use-toast'
import type { Database } from '@/lib/supabase'

type Contact = Database['public']['Tables']['contacts']['Row']

interface ContactEmailFormProps {
  isOpen: boolean
  onClose: () => void
  contact: Contact | null
}

export default function ContactEmailForm({ isOpen, onClose, contact }: ContactEmailFormProps) {
  const [emailForm, setEmailForm] = useState({
    recipient: '',
    subject: '',
    body: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (contact && isOpen) {
      // Pre-fill recipient with contact's email
      setEmailForm((prev) => ({
        ...prev,
        recipient: contact.email || '',
      }))
    }
  }, [contact, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!emailForm.recipient || !emailForm.subject || !emailForm.body) {
      toast({
        title: 'Error',
        description: 'Please fill in all email fields.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'https://your-n8n-webhook-url.com'

      const emailData = {
        recipient: emailForm.recipient,
        subject: emailForm.subject,
        body: emailForm.body,
        contact: {
          id: contact?.id,
          name: contact ? `${contact.first_name} ${contact.last_name}` : '',
          email: contact?.email,
          phone: contact?.phone,
        },
        timestamp: new Date().toISOString(),
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      })

      if (response.ok) {
        toast({
          title: 'Email sent',
          description: `Email sent successfully to ${emailForm.recipient}`,
        })

        // Reset form and close
        handleClose()
      } else {
        throw new Error('Failed to send email')
      }
    } catch (error) {
      console.error('Error sending email:', error)
      toast({
        title: 'Error',
        description: 'Failed to send email. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setEmailForm({
      recipient: contact?.email || '',
      subject: '',
      body: '',
    })
    onClose()
  }

  return (
    <ModalForm
      isOpen={isOpen}
      title={
        <div className="flex items-center space-x-2">
          <Send className="h-4 w-4" />
          <span>Send Email</span>
        </div>
      }
      onSubmit={handleSubmit}
      onCancel={handleClose}
      isLoading={isSubmitting}
      submitText="Send Email"
      zIndex={60}
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="recipient">To</Label>
          <Input
            id="recipient"
            type="email"
            value={emailForm.recipient}
            onChange={(e) => setEmailForm({ ...emailForm, recipient: e.target.value })}
            required
            placeholder="recipient@example.com"
          />
        </div>

        <div>
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            value={emailForm.subject}
            onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
            required
            placeholder="Email subject"
          />
        </div>

        <div>
          <Label htmlFor="body">Message</Label>
          <Textarea
            id="body"
            value={emailForm.body}
            onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
            required
            placeholder="Enter your message here..."
            rows={8}
          />
        </div>

        {contact && (
          <div className="rounded-md bg-gray-50 p-3">
            <div className="text-sm font-medium text-gray-700">Contact Information</div>
            <div className="mt-1 space-y-1 text-sm text-gray-600">
              <div>
                Name: {contact.first_name} {contact.last_name}
              </div>
              {contact.phone && <div>Phone: {formatPhoneNumber(contact.phone)}</div>}
              {contact.email && <div>Email: {contact.email}</div>}
            </div>
          </div>
        )}
      </div>
    </ModalForm>
  )
}
