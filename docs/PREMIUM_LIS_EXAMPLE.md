# LIS/Extra Help Premium Example

This document demonstrates how the new premium fields work for plans that qualify for Low-Income Subsidy (LIS) and Extra Help.

## Example Plan Metadata

```json
{
  "premium_monthly": 31.40,
  "premium_monthly_with_extra_help": 0.00,
  "giveback_monthly": 15.00,
  "otc_benefit_quarterly": 50.00,
  "medical_deductible": 990.00,
  "medical_deductible_with_medicaid": 0.00
}
```

## Usage Examples

### Basic Premium Calculation

```typescript
import { premiumCalculations } from '@/lib/plan-metadata-utils'

// For a beneficiary WITHOUT Extra Help
const standardPremium = premiumCalculations.getEffectivePremium(plan, false)
// Returns: 31.40

// For a beneficiary WITH Extra Help
const extraHelpPremium = premiumCalculations.getEffectivePremium(plan, true)
// Returns: 0.00
```

### Premium Range Display

```typescript
const range = premiumCalculations.getPremiumRange(plan)
// Returns: { min: 0.00, max: 31.40 }

// Display in UI: "$0 - $31.40"
```


### Medical Deductible Calculation

```typescript
// For a beneficiary WITHOUT Medicaid cost-sharing
const standardDeductible = premiumCalculations.getEffectiveMedicalDeductible(plan, false)
// Returns: 990.00

// For a beneficiary WITH Medicaid cost-sharing
const medicaidDeductible = premiumCalculations.getEffectiveMedicalDeductible(plan, true)
// Returns: 0.00
```

### Medical Deductible Range Display

```typescript
const deductibleRange = premiumCalculations.getMedicalDeductibleRange(plan)
// Returns: { min: 0.00, max: 990.00 }

// Display in UI: "$0 - $990"
```


## Medicare Documentation Reference

According to Medicare documentation:

### Premium Information:
- **Standard Premium**: $0 to $31.40
- **With Extra Help**: $0 (federal government pays the full premium)
- **Extra Help Benefit**: "If you receive Extra Help from Medicare to help pay for your Medicare prescription drug plan costs, your monthly plan premium will be reduced to $0"
- **Part B Requirement**: "You must continue to pay your Part B premium, if applicable" (applies to all Medicare plans)

### Medical Deductible Information:
- **Standard Deductible**: $0 to $990
- **With Medicaid Cost-Sharing**: $0 (state Medicaid program pays the deductible)
- **Medicaid Eligibility Change**: "If your category of Medicaid eligibility changes, you may be responsible for a $990 deductible for your covered medical services"
- **Exclusions**: "The deductible does not apply to Medicare Part B-covered insulin (when you use insulin via a pump) or Medicare-covered preventive services"

## Database Query Examples

### Find plans with Extra Help support
```sql
SELECT name, metadata->>'premium_monthly_with_extra_help' as extra_help_premium
FROM plans 
WHERE metadata ? 'premium_monthly_with_extra_help'
  AND (metadata->>'premium_monthly_with_extra_help')::numeric = 0;
```

### Find plans with maximum premium
```sql
SELECT name, metadata->>'premium_monthly_max' as max_premium
FROM plans 
WHERE metadata ? 'premium_monthly_max'
  AND (metadata->>'premium_monthly_max')::numeric > 0;
```


### Find plans with Medicaid cost-sharing support
```sql
SELECT name, metadata->>'medical_deductible_with_medicaid' as medicaid_deductible
FROM plans 
WHERE metadata ? 'medical_deductible_with_medicaid'
  AND (metadata->>'medical_deductible_with_medicaid')::numeric = 0;
```


