/**
 * Schema Parser for Plans Metadata
 * 
 * This utility parses the JSON schema and extracts field definitions
 * for dynamic form generation. It serves as the bridge between the
 * schema definition and the UI components.
 */

export interface FieldDefinition {
  key: string
  type: 'string' | 'number' | 'integer' | 'date'
  label: string
  section: string
  description: string
  validation?: {
    minimum?: number
    maximum?: number
    enum?: string[]
    required?: boolean
  }
  format?: 'date' | 'email' | 'url'
}

export interface SectionDefinition {
  key: string
  title: string
  description: string
  order: number
}

export interface ParsedSchema {
  sections: SectionDefinition[]
  fields: FieldDefinition[]
  fieldsBySection: Record<string, FieldDefinition[]>
}

/**
 * Parse the JSON schema and extract field definitions
 */
export function parseSchema(schema: Record<string, unknown>): ParsedSchema {
  const sections: SectionDefinition[] = []
  const fields: FieldDefinition[] = []
  const fieldsBySection: Record<string, FieldDefinition[]> = {}

  // Extract sections
  if (schema.sections) {
    Object.entries(schema.sections as Record<string, unknown>).forEach(([key, section]) => {
      sections.push({
        key,
        title: (section as Record<string, unknown>).title as string,
        description: (section as Record<string, unknown>).description as string,
        order: (section as Record<string, unknown>).order as number
      })
    })
  }

  // Sort sections by order
  sections.sort((a, b) => a.order - b.order)

  // Extract fields
  if (schema.properties) {
    Object.entries(schema.properties as Record<string, unknown>).forEach(([key, property]) => {
      const prop = property as Record<string, unknown>
      const field: FieldDefinition = {
        key,
        type: mapJsonSchemaTypeToFieldType(prop.type as string, prop.format as string),
        label: (prop.label as string) || key,
        section: (prop.section as string) || 'uncategorized',
        description: (prop.description as string) || '',
        validation: extractValidation(prop),
        format: prop.format as 'url' | 'email' | 'date' | undefined
      }

      fields.push(field)

      // Group by section
      if (!fieldsBySection[field.section]) {
        fieldsBySection[field.section] = []
      }
      fieldsBySection[field.section].push(field)
    })
  }

  // Sort fields within each section
  Object.keys(fieldsBySection).forEach(sectionKey => {
    fieldsBySection[sectionKey].sort((a, b) => a.label.localeCompare(b.label))
  })

  return {
    sections,
    fields,
    fieldsBySection
  }
}

/**
 * Map JSON Schema types to our field types
 */
function mapJsonSchemaTypeToFieldType(jsonType: string, format?: string): FieldDefinition['type'] {
  if (format === 'date') return 'date'
  if (jsonType === 'integer') return 'integer'
  if (jsonType === 'number') return 'number'
  return 'string'
}

/**
 * Extract validation rules from JSON Schema property
 */
function extractValidation(property: Record<string, unknown>): FieldDefinition['validation'] {
  const validation: FieldDefinition['validation'] = {}

  if (property.minimum !== undefined) validation.minimum = property.minimum as number
  if (property.maximum !== undefined) validation.maximum = property.maximum as number
  if (property.enum) validation.enum = property.enum as string[]
  if (property.required !== undefined) validation.required = property.required as boolean

  return Object.keys(validation).length > 0 ? validation : undefined
}

/**
 * Get fields for a specific section
 */
export function getFieldsForSection(schema: ParsedSchema, sectionKey: string): FieldDefinition[] {
  return schema.fieldsBySection[sectionKey] || []
}

/**
 * Get all sections in order
 */
export function getSectionsInOrder(schema: ParsedSchema): SectionDefinition[] {
  return schema.sections
}

/**
 * Get a specific field definition
 */
export function getFieldDefinition(schema: ParsedSchema, fieldKey: string): FieldDefinition | undefined {
  return schema.fields.find(field => field.key === fieldKey)
}

/**
 * Validate a field value against its definition
 */
export function validateFieldValue(field: FieldDefinition, value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return field.validation?.required ? `${field.label} is required` : null
  }

  if (field.type === 'number' || field.type === 'integer') {
    const numValue = typeof value === 'string' ? parseFloat(value) : Number(value)
    
    if (isNaN(numValue)) {
      return `${field.label} must be a valid number`
    }

    if (field.validation?.minimum !== undefined && numValue < field.validation.minimum) {
      return `${field.label} must be at least ${field.validation.minimum}`
    }

    if (field.validation?.maximum !== undefined && numValue > field.validation.maximum) {
      return `${field.label} must be at most ${field.validation.maximum}`
    }
  }

  if (field.validation?.enum && !field.validation.enum.includes(value as string)) {
    return `${field.label} must be one of: ${field.validation.enum.join(', ')}`
  }

  return null
}

/**
 * Get default value for a field type
 */
export function getDefaultValue(field: FieldDefinition): unknown {
  switch (field.type) {
    case 'number':
    case 'integer':
      return ''
    case 'date':
      return ''
    case 'string':
      return ''
    default:
      return ''
  }
}

/**
 * Format field value for display
 */
export function formatFieldValue(field: FieldDefinition, value: unknown): string {
  if (value === null || value === undefined) return ''
  
  if (field.type === 'number' && typeof value === 'number') {
    return value.toString()
  }
  
  if (field.type === 'date' && value instanceof Date) {
    return value.toISOString().split('T')[0]
  }
  
  return String(value)
}
