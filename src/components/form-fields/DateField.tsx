'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { FieldDefinition } from '@/lib/schema-parser'

interface DateFieldProps {
  field: FieldDefinition
  value: unknown
  onChange: (value: unknown) => void
  isReadOnly?: boolean
  className?: string
}

export default function DateField({
  value,
  onChange,
  isReadOnly = false,
  className = ''
}: DateFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  return (
    <Input
      type="date"
      value={(value as string) || ''}
      onChange={handleChange}
      readOnly={isReadOnly}
      className={`${isReadOnly ? 'bg-muted' : ''} ${className}`}
    />
  )
}
