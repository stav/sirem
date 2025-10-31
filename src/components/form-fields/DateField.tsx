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

const DateField = React.memo(function DateField({
  field,
  value,
  onChange,
  isReadOnly = false,
  className = '',
}: DateFieldProps) {
  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value)
    },
    [onChange]
  )

  return (
    <Input
      type="date"
      value={(value as string) || ''}
      onChange={handleChange}
      readOnly={isReadOnly}
      className={`${isReadOnly ? 'bg-muted' : ''} ${className}`}
      placeholder={field.description}
    />
  )
})

export default DateField
