'use client'

import React from 'react'
import Link from 'next/link'
import { CheckCircle, AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ToastProps {
  id: number
  title: string
  description?: string
  variant?: 'default' | 'destructive'
  onDismiss: (id: number) => void
  contactDetails?: Array<{ id: string; name: string }>
}

// Helper function to render text with clickable contact names
function renderTextWithLinks(text: string, contactDetails?: Array<{ id: string; name: string }>) {
  if (!contactDetails || contactDetails.length === 0) {
    return <>{text}</>
  }

  const elements: React.ReactNode[] = []
  let lastIndex = 0

  // Replace each contact name with a clickable link
  contactDetails.forEach((contact, index) => {
    const nameIndex = text.indexOf(contact.name, lastIndex)
    if (nameIndex !== -1) {
      // Add text before the contact name
      if (nameIndex > lastIndex) {
        elements.push(text.slice(lastIndex, nameIndex))
      }

      // Add the clickable contact name
      elements.push(
        <Link
          key={`contact-${contact.id}-${index}`}
          href={`/manage?contact=${contact.id}`}
          className="text-primary font-semibold hover:underline"
          onClick={(e) => {
            e.stopPropagation()
          }}
        >
          {contact.name}
        </Link>
      )

      lastIndex = nameIndex + contact.name.length
    }
  })

  // Add remaining text
  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex))
  }

  return <>{elements}</>
}

export function Toast({ id, title, description, variant = 'default', onDismiss, contactDetails }: ToastProps) {
  const getIcon = () => {
    if (variant === 'destructive') {
      return <AlertCircle className="h-4 w-4 text-red-700 dark:text-red-300" />
    }
    return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
  }

  const getBackgroundColor = () => {
    if (variant === 'destructive') {
      return 'bg-red-100 dark:bg-red-900 border-red-300 dark:border-red-700'
    }
    return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
  }

  return (
    <div
      className={`w-full max-w-sm rounded-lg border p-4 shadow-xl ${getBackgroundColor()} animate-in slide-in-from-right-full relative z-[9999] cursor-pointer duration-300`}
      onClick={() => onDismiss(id)}
    >
      <div className="flex items-start space-x-3">
        <div className="mt-0.5 flex-shrink-0">{getIcon()}</div>
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-medium ${variant === 'destructive' ? 'text-red-900 dark:text-red-100' : 'text-foreground'}`}
          >
            {renderTextWithLinks(title, contactDetails)}
          </p>
          {description && (
            <p
              className={`mt-1 text-sm ${variant === 'destructive' ? 'text-red-800 dark:text-red-200' : 'text-muted-foreground'}`}
            >
              {description}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-6 flex-shrink-0 p-0 ${variant === 'destructive' ? 'text-red-700 hover:text-red-900 dark:text-red-300 dark:hover:text-red-100' : ''}`}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
