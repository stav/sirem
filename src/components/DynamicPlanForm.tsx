'use client'

import React from 'react'
import { parseSchema, ParsedSchema, SectionDefinition, FieldDefinition } from '@/lib/schema-parser'
import { Label } from '@/components/ui/label'
import FieldRenderer from '@/components/form-fields/FieldRenderer'
import { plansMetadataSchema } from '@/schema/plans-metadata-schema'

interface DynamicPlanFormProps {
  formData: Record<string, unknown>
  onChange: (field: string, value: unknown) => void
  mode: 'create' | 'edit' | 'compare'
  sections?: string[] // Optional: filter specific sections
  fields?: string[]   // Optional: filter specific fields
  className?: string
}

export default function DynamicPlanForm({
  formData,
  onChange,
  mode,
  sections,
  fields,
  className = ''
}: DynamicPlanFormProps) {
  // Parse the schema
  const schema: ParsedSchema = parseSchema(plansMetadataSchema)

  // Filter sections if specified
  const filteredSections = React.useMemo(() => {
    if (!sections) return schema.sections
    return schema.sections.filter(section => sections.includes(section.key))
  }, [schema.sections, sections])

  // Filter fields if specified
  const filteredFieldsBySection = React.useMemo(() => {
    const result: Record<string, FieldDefinition[]> = {}
    
    filteredSections.forEach(section => {
      const sectionFields = schema.fieldsBySection[section.key] || []
      if (fields) {
        result[section.key] = sectionFields.filter(field => fields.includes(field.key))
      } else {
        result[section.key] = sectionFields
      }
    })
    
    return result
  }, [schema.fieldsBySection, filteredSections, fields])

  const handleFieldChange = React.useCallback((fieldKey: string, value: unknown) => {
    onChange(fieldKey, value)
  }, [onChange])

  const renderField = React.useCallback((field: FieldDefinition) => {
    const value = formData[field.key] || ''
    const isReadOnly = mode === 'compare'

    return (
      <FieldRenderer
        key={field.key}
        field={field}
        value={value}
        onChange={(newValue) => handleFieldChange(field.key, newValue)}
        isReadOnly={isReadOnly}
      />
    )
  }, [formData, mode, handleFieldChange])

  const renderSection = React.useCallback((section: SectionDefinition) => {
    const sectionFields = filteredFieldsBySection[section.key] || []
    
    if (sectionFields.length === 0) return null

    return (
      <div key={section.key} className="space-y-4">
        {/* Section Header */}
        <div className="border-b border-t pt-2 pb-2">
          <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
          {section.description && (
            <p className="text-xs text-muted-foreground mt-1">{section.description}</p>
          )}
        </div>

        {/* Section Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sectionFields.map((field) => (
            <div key={field.key} className="space-y-1">
              <Label className="text-xs">{field.label}</Label>
              {renderField(field)}
              {field.description && (
                <p className="text-xs text-muted-foreground">{field.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }, [filteredFieldsBySection, renderField])

  return (
    <div className={`space-y-6 ${className}`}>
      {filteredSections.map(renderSection)}
    </div>
  )
}

/**
 * Hook to get parsed schema data
 */
export function useSchema() {
  return React.useMemo(() => parseSchema(plansMetadataSchema), [])
}

/**
 * Hook to get fields for a specific section
 */
export function useFieldsForSection(sectionKey: string) {
  const schema = useSchema()
  return React.useMemo(() => schema.fieldsBySection[sectionKey] || [], [schema, sectionKey])
}

/**
 * Hook to get all sections
 */
export function useSections() {
  const schema = useSchema()
  return React.useMemo(() => schema.sections, [schema])
}
