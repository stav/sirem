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

const NumberField = React.memo(function NumberField({
  field,
  value,
  onChange,
  isReadOnly = false,
  className = ''
}: NumberFieldProps) {
  const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
  }, [onChange])

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
})

export default NumberField
