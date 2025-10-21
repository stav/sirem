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

const TextareaField = React.memo(function TextareaField({
  field,
  value,
  onChange,
  isReadOnly = false,
  className = ''
}: TextareaFieldProps) {
  const handleChange = React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }, [onChange])

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
})

export default TextareaField
