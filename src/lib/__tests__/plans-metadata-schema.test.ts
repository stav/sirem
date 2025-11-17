import { describe, it, expect } from 'vitest'

import { parseSchema } from '@/lib/schema-parser'
import { plansMetadataSchema } from '@/schema/plans-metadata-schema'

const schema = parseSchema(plansMetadataSchema)

const conceptKeyExceptions = new Set(['coverage_limit'])

describe('plans metadata schema characteristics', () => {
  const baseDefinitions = schema.fields.filter((field) => !field.baseKey)

  it('ensures every base field with characteristics has a concept reflected in the key', () => {
    baseDefinitions.forEach((field) => {
      if (!field.characteristics) return

      const concept = field.characteristics.concept
      expect(concept, `${field.key} is missing a concept`).toBeTruthy()

      if (concept && !conceptKeyExceptions.has(concept)) {
        const normalizedKey = field.key.toLowerCase()
        const normalizedConcept = concept.toLowerCase()
        expect(normalizedKey.includes(normalizedConcept), `${field.key} should include concept '${concept}'`).toBe(true)
      }
    })
  })

  it('ensures variants only override allowed characteristics and declare eligibility', () => {
    schema.fields
      .filter((field) => field.baseKey)
      .forEach((variantField) => {
        const baseField = schema.fields.find((field) => field.key === variantField.baseKey)
        expect(baseField, `Base field ${variantField.baseKey} missing for variant ${variantField.key}`).toBeDefined()

        expect(
          variantField.characteristics?.eligibility,
          `Variant ${variantField.key} must declare eligibility`
        ).toBeTruthy()

        if (baseField?.characteristics) {
          const baseChars = baseField.characteristics
          const variantChars = variantField.characteristics || {}
          const allowedDifferences = new Set(['eligibility', 'modifier', 'unit', 'frequency'])

          ;(['concept', 'direction', 'frequency', 'type'] as const).forEach((key) => {
            if (key in variantChars && !allowedDifferences.has(key)) {
              expect(
                variantChars[key],
                `Variant ${variantField.key} should not override '${key}' without good reason`
              ).toEqual(baseChars[key])
            }
          })
        }
      })
  })
})
