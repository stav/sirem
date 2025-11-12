'use client'

import React from 'react'
import { FieldDefinition } from '@/lib/schema-parser'
import NumberField from './NumberField'
import DateField from './DateField'
import SelectField from './SelectField'
import TextField from './TextField'
import TextareaField from './TextareaField'

interface FieldRendererProps {
  field: FieldDefinition
  value: unknown
  onChange: (value: unknown) => void
  isReadOnly?: boolean
  className?: string
}

const FieldRenderer = React.memo(function FieldRenderer({
  field,
  value,
  onChange,
  isReadOnly = false,
  className = '',
}: FieldRendererProps) {
  const renderField = () => {
    switch (field.type) {
      case 'number':
      case 'integer':
        return (
          <NumberField field={field} value={value} onChange={onChange} isReadOnly={isReadOnly} className={className} />
        )

      case 'date':
        return (
          <DateField field={field} value={value} onChange={onChange} isReadOnly={isReadOnly} className={className} />
        )

      case 'string':
        // Check if it's an enum field
        if (field.validation?.enum) {
          return (
            <SelectField
              field={field}
              value={value}
              onChange={onChange}
              isReadOnly={isReadOnly}
              className={className}
            />
          )
        }

        // Check if it's a long text field
        if (isLongTextField(field)) {
          return (
            <TextareaField
              field={field}
              value={value}
              onChange={onChange}
              isReadOnly={isReadOnly}
              className={className}
            />
          )
        }

        // Regular text input
        return (
          <TextField field={field} value={value} onChange={onChange} isReadOnly={isReadOnly} className={className} />
        )

      default:
        return (
          <TextField field={field} value={value} onChange={onChange} isReadOnly={isReadOnly} className={className} />
        )
    }
  }

  return renderField()
})

export default FieldRenderer

/**
 * Determine if a field should use a textarea instead of a regular input
 */
function isLongTextField(field: FieldDefinition): boolean {
  const longTextFields = [
    'notes',
    'summary',
    'description',
    'rx_cost_share',
    'service_area',
  ]

  return longTextFields.some(
    (keyword) => field.key.toLowerCase().includes(keyword) || field.label.toLowerCase().includes(keyword)
  )
}
