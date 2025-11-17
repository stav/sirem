# Plans and Enrollments Implementation Guide

## Overview

The Sirem CRM system includes a comprehensive Medicare plans management system that handles plan catalogs, benefits data, and contact enrollments. The system supports multiple plan types (HMO, PPO, D-SNP, etc.), carriers, and detailed benefits tracking for Medicare Advantage and related insurance products.

## Database Schema

### Plans Table

The core plans catalog table stores master plan information with a normalized plan type structure:

```sql
CREATE TABLE plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Core identifiers (main database fields)
  name TEXT NOT NULL,
  carrier TEXT,
  plan_year INTEGER,

  -- Normalized plan type structure (replaces legacy plan_type field)
  type_network TEXT, -- HMO, PPO, PFFS, MSA
  type_extension TEXT, -- POS or null
  type_snp TEXT, -- D, C, I or null
  type_program TEXT, -- SNP, MA, MAPD, PDP, Supplement, Ancillary

  -- CMS identifiers
  cms_contract_number TEXT,
  cms_plan_number TEXT,
  cms_geo_segment TEXT, -- Three-digit county identifier (e.g., "001")

  -- Geographic coverage
  counties TEXT[],

  -- Flexible metadata storage
  metadata JSONB
);
```

**Key Features:**

- **Simplified Schema**: Only essential fields stored as database columns
- **CMS ID Construction**: Dynamically combines contract, plan, and geo segment numbers in the UI
- **Flexible Metadata**: All plan benefits and details stored in JSONB metadata field
- **Timezone Handling**: All timestamps use UTC [[memory:5285941]]

**Main Database Fields:**

- `id`, `created_at`, `updated_at` - System fields
- `name` - Plan name (required)
- `carrier` - Insurance carrier
- `plan_year` - Plan year (e.g., 2025)
- `type_network` - Plan network type (HMO, PPO, PFFS, MSA)
- `type_extension` - Plan extension (POS or null)
- `type_snp` - SNP type (D, C, I or null)
- `type_program` - Program type (SNP, MA, MAPD, PDP, Supplement, Ancillary)
- `cms_contract_number` - CMS contract identifier
- `cms_plan_number` - CMS plan identifier
- `cms_geo_segment` - Three-digit county identifier (e.g., "001")
- `counties` - Array of county names covered
- `metadata` - JSONB field containing all other plan data

**Metadata Fields:**

The `metadata` JSONB field stores all plan benefits and additional information. The complete field definitions and validation rules are documented in:

- `@/schema/plans-metadata-schema.ts` (TypeScript Schema)
- `src/lib/plan-metadata-utils.ts` (TypeScript interface)

**Field Builder Enumerations:**

- `planMetadataCharacteristicOptions.fieldTypes` → UI-safe list of primitive field types (`string`, `number`).
- `planMetadataCharacteristicOptions.frequency` → Allowed cadence tokens (`daily`, `monthly`, `quarterly`, `yearly`, `per_stay`).
- `planMetadataCharacteristicOptions.units` → Monetary unit tokens exposed in the UI (`$`, `%`).
- `planMetadataCharacteristicOptions.eligibility` → Eligibility tokens including LIS and Medicaid levels (`qdwi`, `qi`, `slmb`, `slmb+`, `qmb`, `qmb+`, `fbde`).
- `planMetadataCharacteristicOptions.medicaidLevels` → Convenience subset for Medicaid-specific selections.

**🔄 DYNAMIC SCHEMA: New fields may be added, changed, or removed at any time as business requirements evolve.**

**Dates:**

- `effective_start` (date): Plan effective start date
- `effective_end` (date): Plan effective end date

**Financial Benefits:**

- `premium_monthly` (numeric): Monthly premium amount
- `premium_monthly_with_extra_help` (numeric): Monthly premium for LIS/Extra Help recipients (typically $0)
- `giveback_monthly` (numeric): Monthly giveback/rebate amount
- `otc_benefit_quarterly` (numeric): Quarterly OTC benefit amount

**Yearly Benefits:**

- `dental_benefit_yearly` (numeric): Annual dental benefit
- `hearing_benefit_yearly` (numeric): Annual hearing benefit
- `vision_benefit_yearly` (numeric): Annual vision benefit

**Medical Copays:**

- `primary_care_copay` (numeric): Primary care physician copay
- `specialist_copay` (numeric): Specialist copay
- `hospital_inpatient_per_day_copay` (numeric): Daily hospital inpatient copay
- `hospital_inpatient_days` (numeric): Number of covered hospital days
- `moop_annual` (numeric): Maximum Out-of-Pocket annual limit
- `ambulance_copay` (numeric): Ambulance service copay
- `emergency_room_copay` (numeric): Emergency room copay
- `urgent_care_copay` (numeric): Urgent care copay

**Medical Deductible with Medicaid Assistance:**

- `medical_deductible` (numeric): Standard medical deductible amount
- `medical_deductible_with_medicaid` (numeric): Medical deductible for Medicaid cost-sharing recipients (typically $0)

**Additional Information:**

- `pharmacy_benefit` (text): Pharmacy benefit description
- `service_area` (text): Service area description
- `notes` (text): General plan notes

**Extended Benefits:**

- `card_benefit` (numeric): Prepaid debit card benefit amount
- `fitness_benefit` (text): Fitness/gym membership benefit
- `transportation_benefit` (numeric): Transportation/rides benefit amount
- `medical_deductible` (numeric): Medical services deductible
- `rx_deductible_tier345` (numeric): Prescription drug deductible for tiers 3, 4, and 5
- `rx_cost_share` (text): Prescription drug cost sharing details
- `medicaid_eligibility` (text): Medicaid eligibility requirements (e.g., "Required", "Not Required")
- `transitioned_from` (text): Previous plan this replaced or transitioned from
- `summary` (text): Additional plan summary or highlights

### Enrollments Table

Links contacts to plans with enrollment lifecycle tracking:

```sql
CREATE TABLE enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES plans(id) ON DELETE RESTRICT NOT NULL,

  -- Enrollment lifecycle
  enrollment_status enrollment_status,
  application_id TEXT,
  signed_up_at TIMESTAMP WITH TIME ZONE,
  coverage_effective_date TIMESTAMP WITH TIME ZONE,
  coverage_end_date TIMESTAMP WITH TIME ZONE,

  -- Member-specific data
  premium_monthly_at_enrollment NUMERIC(10,2),
  pcp_name TEXT,
  pcp_id TEXT,
  agent_notes TEXT,
  disenrollment_reason TEXT,

  metadata JSONB
);
```

**Key Features:**

- **Contact Relationship**: Foreign key with cascade delete for contacts
- **Plan Protection**: Restrict deletion of plans with active enrollments
- **Status Tracking**: Lifecycle management (pending, active, cancelled, terminated, declined)
- **Historical Data**: Captures premium and PCP at time of enrollment

### Plan Type Structure

**🎯 SINGLE SOURCE OF TRUTH: All plan types are now managed in `src/lib/plan-constants.ts`**

The plan type system has been refactored to use a normalized structure with separate fields for better data integrity and querying:

#### Normalized Plan Type Fields

**Database Structure:**

```sql
-- Normalized plan type fields (no constraints - validation in code)
type_network TEXT,    -- HMO, PPO, PFFS, MSA
type_extension TEXT,  -- POS or null
type_snp TEXT,        -- D, C, I or null
type_program TEXT     -- SNP, MA, MAPD, PDP, Supplement, Ancillary
```

**TypeScript Types:**

```typescript
// Defined in src/lib/plan-constants.ts
type TypeNetwork = 'HMO' | 'PPO' | 'PFFS' | 'MSA'
type TypeExtension = 'POS' | null
type TypeSnp = 'D' | 'C' | 'I' | null
type TypeProgram = 'SNP' | 'MA' | 'MAPD' | 'PDP' | 'Supplement' | 'Ancillary'

interface PlanTypeStructure {
  type_network: TypeNetwork
  type_extension: TypeExtension
  type_snp: TypeSnp
  type_program: TypeProgram
}
```

**Legacy Plan Type Parsing:**

```typescript
// Converts legacy strings like "HMO-POS-D-SNP" into normalized structure
function parseLegacyPlanType(value: string): PlanTypeStructure | null
```

**Plan Type Concatenation Logic:**
The UI displays a combined plan type by concatenating the normalized fields:

```typescript
// Build the plan type string from normalized fields
const parts = []
if (plan.type_network) parts.push(plan.type_network) // "HMO"
if (plan.type_extension) parts.push(plan.type_extension) // "POS"
if (plan.type_snp) parts.push(`${plan.type_snp}-SNP`) // "D-SNP"
// Don't add type_program if it's already included in the SNP part
if (plan.type_program && plan.type_program !== 'MA' && plan.type_program !== 'SNP') parts.push(plan.type_program) // "PDP", "Supplement", etc.

const combinedType = parts.join('-') // "HMO-POS-D-SNP"
```

**Examples:**

- `HMO` + `null` + `null` + `MA` → **"HMO"**
- `HMO` + `POS` + `null` + `MA` → **"HMO-POS"**
- `HMO` + `null` + `D` + `SNP` → **"HMO-D-SNP"**
- `HMO` + `POS` + `D` + `SNP` → **"HMO-POS-D-SNP"**
- `PPO` + `null` + `null` + `MA` → **"PPO"**
- `null` + `null` + `null` + `PDP` → **"PDP"**
- `null` + `null` + `null` + `Supplement` → **"Supplement"**

**Key Rules:**

- `type_program` is omitted when it's "MA" (default for most plans)
- `type_program` is omitted when it's "SNP" (already included in `type_snp` field)
- Only non-null fields are included in the concatenation
- Fields are joined with hyphens (`-`)

**Benefits:**

- ✅ **Better data integrity** - Separate fields prevent invalid combinations
- ✅ **Easier querying** - Filter by network type, SNP type, etc.
- ✅ **Single source of truth** - All types defined in `plan-constants.ts`
- ✅ **Clean schema** - Legacy `plan_type` field removed after migration
- ✅ **Type safety** - Full TypeScript support for all fields

#### Carriers

**🎯 SINGLE SOURCE OF TRUTH: All carriers are now managed in `src/lib/plan-constants.ts`**

Database enums eliminated! Now using TEXT columns with validation in code:

```typescript
// Defined in src/lib/plan-constants.ts
type Carrier =
  | 'Aetna'
  | 'Anthem'
  | 'CareSource'
  | 'Devoted'
  | 'GTL'
  | 'Heartland'
  | 'Humana'
  | 'Medico'
  | 'MedMutual'
  | 'SummaCare'
  | 'United'
  | 'Zing'
  | 'Other'
```

#### Enrollment Status

**🎯 SINGLE SOURCE OF TRUTH: All enrollment statuses are now managed in `src/lib/plan-constants.ts`**

Database enums eliminated! Now using TEXT columns with validation in code:

```typescript
// Defined in src/lib/plan-constants.ts
type EnrollmentStatus = 'pending' | 'active' | 'cancelled' | 'terminated' | 'declined' | 'ended'
```

### Database Indexes

Optimized indexes for performance:

```sql
-- Plans table
CREATE INDEX idx_plans_carrier ON plans(carrier);
CREATE INDEX idx_plans_plan_year ON plans(plan_year);
CREATE INDEX idx_plans_cms_lookup ON plans(plan_year, cms_contract_number, cms_plan_number, cms_geo_segment);

-- Normalized plan type indexes
CREATE INDEX idx_plans_type_network ON plans(type_network);
CREATE INDEX idx_plans_type_extension ON plans(type_extension);
CREATE INDEX idx_plans_type_snp ON plans(type_snp);
CREATE INDEX idx_plans_type_program ON plans(type_program);
CREATE INDEX idx_plans_type_composite ON plans(type_network, type_extension, type_snp, type_program);

-- Enrollments table
CREATE INDEX idx_enrollments_contact_id ON enrollments(contact_id);
CREATE INDEX idx_enrollments_plan_id ON enrollments(plan_id);
CREATE INDEX idx_enrollments_status ON enrollments(enrollment_status);
CREATE INDEX idx_enrollments_effective ON enrollments(coverage_effective_date);

-- CMS uniqueness constraint (prevents duplicate plans)
ALTER TABLE plans ADD CONSTRAINT plans_unique_cms_complete
UNIQUE (plan_year, cms_contract_number, cms_plan_number, cms_geo_segment);
```

## TypeScript Types and Interfaces

### Core Plan Types

```typescript
type Plan = Database['public']['Tables']['plans']['Row']
type PlanInsert = Database['public']['Tables']['plans']['Insert']
type PlanUpdate = Database['public']['Tables']['plans']['Update']

type PlanForm = Omit<PlanInsert, 'id' | 'created_at' | 'updated_at'>
```

### Enrollment Types

```typescript
type Enrollment = Database['public']['Tables']['enrollments']['Row']
type EnrollmentInsert = Database['public']['Tables']['enrollments']['Insert']
type EnrollmentUpdate = Database['public']['Tables']['enrollments']['Update']
```

### Plan Type Types

```typescript
// Normalized plan type structure
type TypeNetwork = 'HMO' | 'PPO' | 'PFFS' | 'MSA'
type TypeExtension = 'POS' | null
type TypeSnp = 'D' | 'C' | 'I' | null
type TypeProgram = 'SNP' | 'MA' | 'MAPD' | 'PDP' | 'Supplement' | 'Ancillary'

// Legacy and other types
type Carrier =
  | 'Aetna'
  | 'Anthem'
  | 'CareSource'
  | 'Devoted'
  | 'GTL'
  | 'Heartland'
  | 'Humana'
  | 'Medico'
  | 'MedMutual'
  | 'SummaCare'
  | 'United'
  | 'Zing'
  | 'Other'
type EnrollmentStatus = 'pending' | 'active' | 'cancelled' | 'terminated' | 'declined' | 'ended'
```

## React Hooks

### usePlans Hook

**Location**: `src/hooks/usePlans.ts`

Manages plan data operations:

```typescript
interface UsePlansReturn {
  plans: Plan[]
  loading: boolean
  error: string | null
  fetchPlans: () => Promise<void>
  createPlan: (form: PlanForm) => Promise<boolean>
  updatePlan: (planId: string, form: PlanForm) => Promise<boolean>
  deletePlan: (planId: string) => Promise<boolean>
}
```

**Features:**

- Automatic fetching on mount
- Sorted by year (descending), carrier, and name
- Error handling with user-friendly messages
- Loading states for UI feedback

**Usage:**

```typescript
const { plans, loading, createPlan, updatePlan, deletePlan } = usePlans()

// Create a new plan
await createPlan({
  name: 'Gold Plus',
  type_network: 'HMO',
  type_extension: null,
  type_snp: null,
  type_program: 'MA',
  carrier: 'Humana',
  plan_year: 2025,
  premium_monthly: 0,
  giveback_monthly: 50,
  // ... other fields
})
```

### usePlanEnrollments Hook

**Location**: `src/hooks/usePlanEnrollments.ts`

Manages enrollment operations:

```typescript
interface UsePlanEnrollmentsReturn {
  enrollments: EnrollmentWithDetails[]
  loading: boolean
  error: string | null
  fetchEnrollments: (contactId?: string) => Promise<void>
  createEnrollment: (data: EnrollmentInsert) => Promise<boolean>
  updateEnrollment: (id: string, data: EnrollmentUpdate) => Promise<boolean>
  deleteEnrollment: (id: string) => Promise<boolean>
}
```

**Features:**

- Fetch all enrollments or filter by contact
- Includes plan details with enrollments
- Status updates and lifecycle management
- Cascade operations respect contact relationships

## React Components

### Plans Page

**Location**: `src/app/plans/page.tsx`

Main plans management interface featuring:

#### AG Grid Display

- **Dark Mode Support**: Automatically switches between light (`quartz`) and dark (`quartz-dark`) themes
- **Plan Selection**: Checkbox column for selecting up to 3 plans for comparison
- **Comprehensive Columns**:
  - Plan name, carrier, year
  - **Type** - Combined plan type (e.g., "HMO-POS", "D-SNP", "PPO-D-SNP")
  - **Network** - Individual network type (HMO, PPO, PFFS, MSA)
  - **Extension** - Individual extension type (POS or —)
  - **SNP** - Individual SNP type (D-SNP, C-SNP, I-SNP, or —)
  - **Program** - Individual program type (MA, SNP, PDP, Supplement, Ancillary)
  - CMS ID display
- All columns are sortable and filterable
- Inline edit/delete actions

**Theme Integration:**

```typescript
const { theme } = useTheme()
const [gridTheme, setGridTheme] = useState(getCurrentTheme())

// Updates grid theme reactively when app theme changes
React.useEffect(() => {
  setGridTheme(getCurrentTheme())
}, [theme])
```

#### Add Plan Form

Comprehensive inline form with two main sections:

**Main Database Fields:**

- Plan name (required)
- Network Type (HMO, PPO, PFFS, MSA)
- Extension (POS or None)
- SNP Type (D-SNP, C-SNP, I-SNP, or None)
- Program Type (SNP, MA, MAPD, PDP, Supplement, Ancillary)
- Carrier (select dropdown)
- Plan year (defaults to current year)
- CMS contract number
- CMS plan number
- CMS geo segment
- Counties (comma-separated array)

**Plan Benefits & Details (Metadata):**

- **Dates**: Effective start, Effective end
- **Financial Benefits**: Premium (monthly), Giveback (monthly), OTC (quarterly)
- **Yearly Benefits**: Dental, Hearing, Vision
- **Medical Copays**: PCP, Specialist, Hospital (daily), Hospital days, MOOP, Ambulance, ER, Urgent Care
- **Additional Info**: Pharmacy benefit, Service area, Notes
- **Extended Benefits**: Card benefit, Fitness benefit, Transportation, Medical deductible, RX deductible, RX cost share, Medicaid eligibility, Transitioned from, Summary

#### Edit Modal

Modal-based editing with `ModalForm` component featuring:

- **Main Database Fields** section at the top (essential plan identifiers)
- **Plan Benefits & Details (Metadata)** section below with all benefits and additional information
- Pre-populated with existing data using `extractMetadataForForm` helper
- Validation and save/cancel actions
- Clear visual separation between main fields and metadata

### Plan Comparison Modal

**Location**: `src/components/PlanComparisonModal.tsx`

Provides side-by-side comparison of 2-3 plans with visual indicators and cost calculations.

**Features:**

- **Side-by-Side Comparison**: Compare up to 3 plans simultaneously
- **Visual Indicators**: Shows which plan has better/worse values
  - 🟢 Green arrow up = Better than average
  - 🔴 Red arrow down = Worse than average
  - No indicator = Same as average (clean display)
- **Organized Categories**:
  - Basic Information (CMS ID Full, CMS Contract Number, CMS Plan Number, CMS Geo Segment, Effective Start, Effective End)
  - Monthly Costs (Premium, Giveback, Net Cost)
  - Supplemental Benefits (OTC, Dental, Hearing, Vision)
  - Extended Benefits (Card Benefit, Fitness Benefit, Transportation Benefit)
  - Medical Copays (PCP, Specialist, ER, Urgent Care, Ambulance)
  - Hospital Coverage (Inpatient copay per day, days covered, total per stay, MOOP)
  - Deductibles (Medical Deductible)
  - Prescription Drug Coverage (RX Deductible Tier 3-4-5, RX Cost Share)
  - Additional Information (Service area, counties, Medicaid eligibility, transitioned from, summary, notes)
- **Cost Calculator**: Estimate annual costs based on expected usage
  - Input annual usage (doctor visits, ER visits, etc.)
  - Real-time cost calculations including hospital stays (daily copay × days × stays)
  - Highlights lowest-cost plan with ★ star
- **Metadata Display**: Automatically displays extended benefits from metadata field when available
- **Responsive Design**: Works on all screen sizes with horizontal scrolling

**Usage:**

```typescript
<PlanComparisonModal
  isOpen={showComparison}
  onClose={() => setShowComparison(false)}
  plans={selectedPlans}
/>
```

**Integration:**

- Triggered from Plans Page when 2+ plans are selected
- "Compare (X)" button appears in header
- Modal opens with selected plans pre-loaded

### Contact Plans Manager

**Location**: `src/components/ContactPlansManager.tsx`

Manages plan enrollments for individual contacts:

**Features:**

- Display active enrollments
- Add new enrollments
- Update enrollment status
- Track coverage dates
- Record PCP information
- Agent notes

**Integration:**

- Used within Contact View Modal
- Links to plans catalog
- Shows plan details with enrollment

## Data Flow

### Plan Management Flow

```
PlansPage
├── usePlans Hook (Data Management)
├── AG Grid Display (Read)
├── Add Plan Form (Create)
└── Edit Modal (Update/Delete)
```

### Enrollment Flow

```
ContactViewModal
├── ContactPlansManager
│   ├── usePlanEnrollments Hook
│   ├── Enrollment List Display
│   └── Enrollment Form
└── ContactPlansDisplay (Read-only view)
```

### Creating a Plan

1. User clicks "Add Plan" button
2. Inline form appears with all fields
3. User fills in required fields (name minimum)
4. Optional fields can be left empty
5. Form validates and submits
6. `createPlan` saves to database
7. Grid refreshes to show new plan
8. Form resets and closes

### Enrolling a Contact

1. User opens Contact View Modal
2. Navigates to Plans tab
3. Clicks "Add Enrollment"
4. Selects plan from catalog
5. Fills in enrollment details (status, dates, PCP)
6. Saves enrollment
7. UI refreshes to show enrollment
8. Contact now linked to plan

### Plan Year Management

Plans are typically version by year:

1. Copy previous year's plan data
2. Update plan_year to new year
3. Adjust benefits/premiums for new year
4. Update CMS contract/plan numbers if changed
5. Set effective_start and effective_end dates

## Best Practices

### Plan Data Management

1. **Unique Identification**: Use year + CMS contract + plan + geo segment for uniqueness
2. **Historical Data**: Keep old plan years for enrollment history
3. **Nullability**: All benefit fields are optional to handle partial data
4. **Validation**: Validate numeric fields are positive
5. **Consistency**: Use consistent units (monthly, quarterly, yearly, per-stay)

### Enrollment Management

1. **Status Tracking**: Always maintain current enrollment status
2. **Date Integrity**: Coverage effective date should precede end date
3. **Premium Capture**: Store premium at enrollment for historical accuracy
4. **Disenrollment**: Record reason when status changes to cancelled/terminated
5. **Application Tracking**: Use application_id for carrier tracking

### UI/UX

1. **Grid Performance**: Paginate large plan lists (default: 100 per page)
2. **Filter by Year**: Default to current year for common use
3. **Currency Formatting**: Display all monetary values with $ and 2 decimals
4. **Required Fields**: Clearly mark required fields (name is primary)
5. **Modal Editing**: Use modals for complex edit operations

### Performance Considerations

1. **Indexed Queries**: Leverage indexes for carrier, type, year filtering
2. **Selective Loading**: Only load enrollments when needed
3. **Avoid N+1**: Join plans with enrollments in single query
4. **Cache Plans**: Plans catalog can be cached (changes infrequently)

## Working with Metadata Fields

The `metadata` JSONB field provides flexibility for storing additional plan information that doesn't fit into the standard schema. This is particularly useful for:

**🎯 SCHEMA DEFINITION: The metadata structure uses a hierarchical schema as the single source of truth:**

- `@/schema/plans-metadata-schema.ts` - Hierarchical TypeScript Schema (sections with nested properties arrays) for dynamic forms and validation
- `src/lib/plan-metadata-utils.ts` - Runtime utilities that automatically extract properties from the schema using `getAllProperties()`

**✅ AUTOMATIC SYNCHRONIZATION: The schema is the single source of truth. Properties are extracted at runtime from the hierarchical sections structure, so adding fields to the schema automatically makes them available throughout the application. No manual updates needed in plan-metadata-utils.ts when adding new fields.**

**🔑 KEY PROPERTY REQUIREMENT: Each property in the `properties` array must have a `key` field. This key serves as:**

- The property name in the database JSONB metadata (e.g., `metadata.premium_monthly`)
- The field identifier for form data binding and React keys
- The lookup key for property indexing in `getAllProperties()`
- The unique identifier in `FieldDefinition` objects

Since properties are stored in an array (not an object), the `key` must be explicit - it cannot be inferred from object keys like in flat schemas. This key maps directly to the JSONB property name, while application code should access values through the resolver helpers in `plan-metadata-utils.ts` instead of reading `plan.metadata` directly.

1. **Extended Benefits**: Benefits that vary by carrier or year (card, fitness, transportation)
2. **Prescription Drug Details**: Complex RX coverage that needs more than the pharmacy_benefit field
3. **Eligibility Requirements**: Medicaid or other special eligibility criteria
4. **Historical Data**: Tracking which plans replaced others (transitioned_from)

### Accessing Metadata in Code

```typescript
import { getMetadataValue, getMetadataNumber, getMetadataResolution } from '@/lib/plan-metadata-utils'

// Resolve values directly (automatic variant + fallback handling)
const cardBenefit = getMetadataValue(plan, 'card_benefit')
const lisPremium = getMetadataNumber(plan, 'premium_monthly', 'lis')

// Inspect where a value came from (variant vs. base)
const premiumResolution = getMetadataResolution(plan, 'premium_monthly', 'lis')
if (premiumResolution.source === 'variant') {
  console.log(`Using ${premiumResolution.definition?.key} for LIS context`)
}
```

### Adding Metadata During Import

The CSV import automatically populates metadata fields when columns are present:

```typescript
// From plans-import.ts
const metadata: Record<string, any> = {}
if (col.card >= 0 && r[col.card]) metadata.card_benefit = r[col.card]
if (col.fitness >= 0 && r[col.fitness]) metadata.fitness_benefit = r[col.fitness]
// ... etc
```

### Querying Plans with Metadata

```sql
-- Find plans with card benefits over $100/quarter
SELECT name, carrier, metadata->>'card_benefit' as card_benefit
FROM plans
WHERE (metadata->>'card_benefit')::numeric > 100
AND plan_year = 2025;

-- Find D-SNP plans (typically have Medicaid eligibility)
SELECT name, carrier, metadata->>'medicaid_eligibility' as medicaid
FROM plans
WHERE type_snp = 'D'
AND plan_year = 2025;
```

### Best Practices for Metadata

1. **Consistency**: Use consistent key names across imports (snake_case recommended)
2. **Validation**: Validate numeric values before storing (use `toNumber()` helper)
3. **Nullability**: Store only non-null values to keep metadata object clean
4. **Documentation**: Document new metadata fields in this guide when added
5. **Type Safety**: Use TypeScript type guards when accessing metadata in code

## Common Operations

### Comparing Plans

**From the Plans Page:**

1. Check the boxes next to 2-3 plans you want to compare
2. Click the "Compare (X)" button that appears in the header
3. View the side-by-side comparison with visual indicators
4. Toggle the "Cost Calculator" to estimate annual costs
5. Adjust usage inputs to see how costs change

**Visual Indicators in Comparison:**

- Green arrow up (↑): This plan's value is better than average
- Red arrow down (↓): This plan's value is worse than average
- No indicator: This plan's value matches the average (cleaner display)

**Cost Calculator Usage:**
Enter expected annual usage for:

- Primary care visits
- Specialist visits
- Emergency room visits
- Urgent care visits
- Hospital stays
- Ambulance uses

The calculator will compute total estimated annual cost including premiums, givebacks, and copays. The lowest-cost option is marked with a ★ star.

### Finding Plans for a Contact's Needs

```typescript
// Filter plans by criteria
const matchingPlans = plans.filter((plan) => {
  return (
    plan.plan_year === currentYear &&
    plan.carrier === preferredCarrier &&
    (plan.giveback_monthly ?? 0) > 0 &&
    (plan.moop_annual ?? Infinity) < 5000
  )
})
```

### Calculating Annual Costs

```typescript
function calculateAnnualCost(plan: Plan): number {
  const premium = (plan.premium_monthly ?? 0) * 12
  const giveback = (plan.giveback_monthly ?? 0) * 12
  return premium - giveback
}
```

### Enrollment Status Updates

```typescript
// Update enrollment status when coverage ends
await updateEnrollment(enrollmentId, {
  enrollment_status: 'terminated',
  coverage_end_date: new Date().toISOString(),
  disenrollment_reason: 'Member requested change',
})
```

## Integration Points

### Contact Management

Plans integrate with contacts through:

1. **Enrollments**: Many-to-many relationship via enrollments table
2. **Contact View Modal**: Plans tab shows all enrollments
3. **Contact Roles**: Medicare client role links to plan needs
4. **Actions**: Create follow-up actions for enrollment milestones

### Medicare Client Data

When a contact has Medicare client role:

1. Display relevant plan types (MA, D-SNP, etc.)
2. Match plans to eligibility (Medicaid for D-SNP)
3. Consider Part A/B effective dates for enrollment timing
4. Track subsidy level for premium assistance

### Reporting and Analytics

Potential queries and reports:

1. **Enrollments by Plan**: Count active enrollments per plan
2. **Enrollment Trends**: Track new enrollments over time
3. **Carrier Market Share**: Calculate enrollments by carrier
4. **Premium Revenue**: Sum premiums from all enrollments
5. **Disenrollment Reasons**: Analyze cancellation patterns

## Implemented Features

### ✅ Plan Comparison Tool (Completed)

**Implementation**: `src/components/PlanComparisonModal.tsx`

- ✅ Side-by-side comparison of 2-3 plans
- ✅ Visual indicators highlighting benefit differences
- ✅ Cost calculator based on expected usage
- ✅ Real-time cost calculations with lowest-cost highlighting
- ✅ Organized by benefit categories
- ✅ Responsive design with scrolling support

### ✅ Dark Mode Support (Completed)

**Implementation**: AG Grid theme integration in Plans Page

- ✅ Automatic theme switching with app theme
- ✅ Uses AG Grid's Theming API (v33+)
- ✅ Quartz light/dark themes
- ✅ Reactive updates when theme changes

## Future Enhancements

### Feature Ideas

1. **Star Ratings Integration**
   - Store CMS star ratings (1-5 stars)
   - Filter by minimum star rating
   - Display in plan cards

2. **Formulary Management**
   - Link drug formularies to plans
   - Search drugs by plan
   - Track formulary changes

3. **Commission Tracking**
   - Add commission_rate and commission_amount fields
   - Calculate expected commissions
   - Track commission payments

4. **Document Attachments**
   - Store plan documents (ANOC, EOC, SOBC)
   - Link to carrier websites
   - Versioning for yearly updates

5. **Network Information**
   - Provider network data
   - Hospital coverage
   - Pharmacy networks

6. **Plan Recommendations**
   - AI-powered plan matching
   - Based on contact needs and preferences
   - Cost optimization

7. **Enrollment Workflows**
   - Application tracking
   - Document checklist
   - Reminder automation

8. **Renewal Management**
   - Annual enrollment period tracking
   - Automatic plan year updates
   - Renewal reminders

9. **Benefit Utilization**
   - Track benefit usage (OTC, dental, vision)
   - Remaining benefits calculator
   - Utilization reports

### Technical Improvements

1. **Plan Import/Export**
   - CSV import for bulk plan updates
   - Excel export for offline analysis
   - API integration with carrier data

2. **Caching Strategy**
   - Cache plan catalog (updates infrequent)
   - Invalidate on updates
   - Improve load performance

3. **Advanced Filtering**
   - Multi-criteria filters
   - Saved filter presets
   - Full-text search

4. **Audit Trail**
   - Track plan changes over time
   - Version history
   - Rollback capability

5. **Validation Rules**
   - Business logic validation
   - Cross-field validation
   - Warning for unusual values

### Database Schema Updates (2025)

#### Plan Type Normalization Migration (Completed)

The database schema has been completely refactored to use a normalized plan type structure:

**Migration Steps Completed:**

1. **Added Normalized Fields** - Added `type_network`, `type_extension`, `type_snp`, `type_program` columns
2. **Populated Data** - Migrated all existing `plan_type` data to normalized fields
3. **Updated Application** - Modified all UI components to use normalized fields
4. **Removed Legacy Field** - Dropped the `plan_type` column and its index

**Benefits Achieved:**

- ✅ **Better Data Integrity** - Separate fields prevent invalid combinations
- ✅ **Easier Querying** - Filter by specific plan type components
- ✅ **Single Source of Truth** - All validation in `src/lib/plan-constants.ts`
- ✅ **Clean Schema** - No legacy fields or database enums
- ✅ **Type Safety** - Full TypeScript support for all fields

#### CMS Constraint and Index Optimization

The database schema has been updated to improve both data integrity and query performance:

- **Constraint**: `plans_unique_cms_complete` - Prevents duplicate plans
- **Index**: `idx_plans_cms_lookup` - Improves query performance
- **Fields**: `(plan_year, cms_contract_number, cms_plan_number, cms_geo_segment)`
- **Benefits**: Better duplicate prevention + faster queries

## Migration and Data Management

### Adding Historical Plans

```sql
-- Example: Bulk insert 2024 plans from previous year
INSERT INTO plans (name, type_network, type_extension, type_snp, type_program, carrier, plan_year, ...)
SELECT name, type_network, type_extension, type_snp, type_program, carrier, 2024, ...
FROM plans
WHERE plan_year = 2023;
```

### Updating Plan Year

```sql
-- Update effective dates for new plan year
UPDATE plans
SET effective_start = '2025-01-01',
    effective_end = '2025-12-31'
WHERE plan_year = 2025;
```

### Cleaning Up Old Plans

```sql
-- Soft delete old plans (keep for historical enrollments)
UPDATE plans
SET metadata = jsonb_set(metadata, '{archived}', 'true')
WHERE plan_year < EXTRACT(YEAR FROM CURRENT_DATE) - 3;
```

## Conclusion

The Plans and Enrollments system provides comprehensive Medicare plan management with detailed benefits tracking and enrollment lifecycle management. The implementation uses modern React patterns, TypeScript for type safety, and a flexible database schema that accommodates the complex nature of Medicare Advantage products. The system is designed to scale with business needs while maintaining data integrity and providing excellent user experience for agents managing client enrollments.

## Related Documentation

- `DATETIME_IMPLEMENTATION.md` - Handling dates in enrollment tracking
- `COMPONENT_ARCHITECTURE.md` - General component patterns
- `ROLES_IMPLEMENTATION.md` - Medicare client role integration
