'use client'

import React from 'react'
import { parseSchema, ParsedSchema, SectionDefinition, FieldDefinition } from '@/lib/schema-parser'
import { Label } from '@/components/ui/label'
import FieldRenderer from '@/components/form-fields/FieldRenderer'
import { plansMetadataSchema } from '@/schema/plans-metadata-schema'
import { Plan, getLegacyFields } from '@/lib/plan-metadata-utils'
import { Input } from '@/components/ui/input'

interface DynamicPlanFormProps {
  formData: Record<string, unknown>
  onChange: (field: string, value: unknown) => void
  mode: 'create' | 'edit' | 'compare'
  sections?: string[] // Optional: filter specific sections
  fields?: string[] // Optional: filter specific fields
  className?: string
  plan?: Plan
}

export default function DynamicPlanForm({
  formData,
  onChange,
  mode,
  sections,
  fields,
  className = '',
  plan,
}: DynamicPlanFormProps) {
  // Parse the schema (memoized to avoid re-parsing on every render)
  const schema: ParsedSchema = useSchema()

  // Filter sections if specified
  const filteredSections = React.useMemo(() => {
    if (!sections) return schema.sections
    return schema.sections.filter((section) => sections.includes(section.key))
  }, [schema.sections, sections])

  // Filter fields if specified
  const filteredFieldsBySection = React.useMemo(() => {
    const result: Record<string, FieldDefinition[]> = {}

    filteredSections.forEach((section) => {
      const sectionFields = schema.fieldsBySection[section.key] || []
      if (fields) {
        result[section.key] = sectionFields.filter((field) => fields.includes(field.key))
      } else {
        result[section.key] = sectionFields
      }
    })

    return result
  }, [schema.fieldsBySection, filteredSections, fields])

  const handleFieldChange = React.useCallback(
    (fieldKey: string, value: unknown) => {
      onChange(fieldKey, value)
    },
    [onChange]
  )

  const renderField = React.useCallback(
    (field: FieldDefinition) => {
      const rawValue = formData[field.key]
      const value = rawValue ?? ''
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
    },
    [formData, mode, handleFieldChange]
  )

  const renderVariantField = React.useCallback(
    (variant: FieldDefinition) => {
      const eligibility = variant.characteristics?.eligibility
      return (
        <div key={variant.key} className="space-y-1 rounded-md border border-dashed border-muted-foreground/30 p-3">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>{variant.label}</span>
            {eligibility ? <span className="rounded bg-muted px-2 py-0.5 uppercase tracking-wide">{eligibility}</span> : null}
          </div>
          {renderField(variant)}
          {variant.description && <p className="text-muted-foreground text-xs">{variant.description}</p>}
        </div>
      )
    },
    [renderField]
  )

  const renderFieldGroup = React.useCallback(
    (baseField: FieldDefinition, sectionFields: FieldDefinition[]) => {
      const variantFields = sectionFields.filter((field) => field.baseKey === baseField.key)

      return (
        <div key={baseField.key} className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">{baseField.label}</Label>
            {renderField(baseField)}
            {baseField.description && <p className="text-muted-foreground text-xs">{baseField.description}</p>}
          </div>

          {variantFields.length > 0 && (
            <div className="ml-1 space-y-2 border-l border-border pl-4">
              <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">Variants</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {variantFields.map((variant) => renderVariantField(variant))}
              </div>
            </div>
          )}
        </div>
      )
    },
    [renderField, renderVariantField]
  )

  const renderSection = React.useCallback(
    (section: SectionDefinition) => {
      const sectionFields = filteredFieldsBySection[section.key] || []

      if (sectionFields.length === 0) return null

      const baseFields = sectionFields.filter((field) => !field.baseKey)
      const orphanVariants = sectionFields.filter((field) => field.baseKey && !sectionFields.some((f) => f.key === field.baseKey))

      return (
        <div key={section.key} className="space-y-4">
          {/* Section Header */}
          <div className="border-t border-b pt-2 pb-2">
            <h3 className="text-foreground text-sm font-semibold">{section.title}</h3>
            {section.description && <p className="text-muted-foreground mt-1 text-xs">{section.description}</p>}
          </div>

          <div className="space-y-4">
            {baseFields.map((baseField) => renderFieldGroup(baseField, sectionFields))}

            {orphanVariants.length > 0 && (
              <div className="space-y-2">
                <p className="text-muted-foreground text-xs font-medium">Unlinked Variants</p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {orphanVariants.map((variant) => renderVariantField(variant))}
                </div>
              </div>
            )}
          </div>
        </div>
      )
    },
    [filteredFieldsBySection, renderFieldGroup, renderVariantField]
  )

  const legacyFields = React.useMemo(() => {
    if (!plan || mode !== 'edit') return {}
    return getLegacyFields(plan)
  }, [plan, mode])

  const renderLegacyFields = React.useCallback(() => {
    if (Object.keys(legacyFields).length === 0) return null

    return (
      <div className="space-y-4">
        <div className="border-t border-b pt-2 pb-2">
          <h3 className="text-foreground text-sm font-semibold">Legacy / Custom Fields</h3>
          <p className="text-muted-foreground mt-1 text-xs">
            Fields in metadata that don&apos;t match the current schema. These may be from older versions or custom additions.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(legacyFields).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs">{key}</Label>
              {mode === 'compare' ? (
                <div className="text-sm">{String(value ?? '')}</div>
              ) : (
                <Input
                  value={String(formData[key] ?? value ?? '')}
                  onChange={(e) => onChange(key, e.target.value)}
                  placeholder={key}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }, [legacyFields, formData, mode, onChange])

  return (
    <div className={`space-y-6 ${className}`}>
      {filteredSections.map(renderSection)}
      {renderLegacyFields()}
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
