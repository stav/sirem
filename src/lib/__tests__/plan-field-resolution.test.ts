import { describe, it, expect } from 'vitest'

import { resolveMetadataValue } from '../plan-field-resolution'

const sampleMetadata: Record<string, unknown> = {
  premium_monthly: 31,
  premium_monthly_with_extra_help: 0,
  medical_deductible: 500,
  medical_deductible_with_medicaid: 0,
  ambulance_copay: 35,
}

describe('resolveMetadataValue', () => {
  it('returns base value when no eligibility context is provided', () => {
    const result = resolveMetadataValue(sampleMetadata, 'premium_monthly')
    expect(result).toMatchObject({ source: 'base', key: 'premium_monthly', value: 31 })
  })

  it('returns matching variant when eligibility context matches', () => {
    const result = resolveMetadataValue(sampleMetadata, 'premium_monthly', { eligibility: 'lis' })
    expect(result).toMatchObject({ source: 'variant', key: 'premium_monthly_with_extra_help', value: 0 })
  })

  it('falls back to base when variant value is missing', () => {
    const metadata = { ...sampleMetadata }
    delete metadata.medical_deductible_with_medicaid

    const result = resolveMetadataValue(metadata, 'medical_deductible', { eligibility: 'medicaid' })
    expect(result).toMatchObject({ source: 'base', key: 'medical_deductible', value: 500 })
  })

  it('supports eligibility arrays by choosing first matching variant', () => {
    const result = resolveMetadataValue(sampleMetadata, 'premium_monthly', {
      eligibility: ['medicaid', 'lis'],
    })
    expect(result).toMatchObject({ source: 'variant', key: 'premium_monthly_with_extra_help', value: 0 })
  })

  it('can resolve a variant key directly and fall back to base if variant missing', () => {
    const metadata = { ...sampleMetadata }
    delete metadata.premium_monthly_with_extra_help

    const result = resolveMetadataValue(metadata, 'premium_monthly_with_extra_help')
    expect(result).toMatchObject({ source: 'base', key: 'premium_monthly', value: 31 })
  })
})
