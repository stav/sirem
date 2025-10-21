'use client'

import React from 'react'
import { Textarea } from '@/components/ui/textarea'
import { FieldDefinition } from '@/lib/schema-parser'

interface TextareaFieldProps {
  field: FieldDefinition
  value: unknown
  onChange: (value: unknown) => void
  isReadOnly?: boolean
  className?: string
}

export default function TextareaField({
  field,
  value,
  onChange,
  isReadOnly = false,
  className = ''
}: TextareaFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  return (
    <Textarea
      value={(value as string) || ''}
      onChange={handleChange}
      readOnly={isReadOnly}
      className={`${isReadOnly ? 'bg-muted' : ''} ${className}`}
      placeholder={field.description}
      rows={3}
    />
  )
}
