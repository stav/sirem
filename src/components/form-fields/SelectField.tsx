'use client'

import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FieldDefinition } from '@/lib/schema-parser'

interface SelectFieldProps {
  field: FieldDefinition
  value: unknown
  onChange: (value: unknown) => void
  isReadOnly?: boolean
  className?: string
}

const SelectField = React.memo(function SelectField({
  field,
  value,
  onChange,
  isReadOnly = false,
  className = '',
}: SelectFieldProps) {
  const handleValueChange = React.useCallback(
    (newValue: string) => {
      onChange(newValue)
    },
    [onChange]
  )

  return (
    <Select value={(value as string) || ''} onValueChange={handleValueChange} disabled={isReadOnly}>
      <SelectTrigger className={`${isReadOnly ? 'bg-muted' : ''} ${className}`}>
        <SelectValue placeholder={`Select ${field.label}`} />
      </SelectTrigger>
      <SelectContent>
        {field.validation?.enum?.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
})

export default SelectField
