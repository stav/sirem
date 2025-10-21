'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { FieldDefinition } from '@/lib/schema-parser'

interface NumberFieldProps {
  field: FieldDefinition
  value: unknown
  onChange: (value: unknown) => void
  isReadOnly?: boolean
  className?: string
}

export default function NumberField({
  field,
  value,
  onChange,
  isReadOnly = false,
  className = ''
}: NumberFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
  }

  return (
    <Input
      type="number"
      step={field.type === 'number' ? '0.01' : '1'}
      min={field.validation?.minimum}
      max={field.validation?.maximum}
      value={(value as string) || ''}
      onChange={handleChange}
      readOnly={isReadOnly}
      className={`${isReadOnly ? 'bg-muted' : ''} ${className}`}
      placeholder={field.validation?.minimum ? `Min: ${field.validation.minimum}` : ''}
    />
  )
}
