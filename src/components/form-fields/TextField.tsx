'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { FieldDefinition } from '@/lib/schema-parser'

interface TextFieldProps {
  field: FieldDefinition
  value: unknown
  onChange: (value: unknown) => void
  isReadOnly?: boolean
  className?: string
}

const TextField = React.memo(function TextField({
  field,
  value,
  onChange,
  isReadOnly = false,
  className = '',
}: TextFieldProps) {
  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value)
    },
    [onChange]
  )

  return (
    <Input
      type="text"
      value={(value as string) || ''}
      onChange={handleChange}
      readOnly={isReadOnly}
      className={`${isReadOnly ? 'bg-muted' : ''} ${className}`}
      placeholder={field.description}
    />
  )
})

export default TextField
