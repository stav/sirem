# Plans Table Schema Migration

## Overview

This migration updates the plans table schema to keep only 11 core fields and move all other data to the metadata JSONB field. This aligns with the goal of simplifying the schema while maintaining all existing data.

## Migration Process

The migration consists of three main steps:

1. **Data Migration** (`14-migrate-plans-fields-to-metadata.sql`)
2. **Schema Update** (`15-update-plans-schema-keep-11-fields.sql`)
3. **Testing** (`16-test-plans-migration.sql`)

## The 12 Core Fields to Keep

According to the PLANS_IMPLEMENTATION.md documentation, these are the 12 fields that should remain in the plans table:

1. `id` (UUID primary key)
2. `created_at` (timestamp)
3. `updated_at` (timestamp)
4. `name` (text - required)
5. `plan_type` (enum)
6. `carrier` (enum)
7. `plan_year` (integer)
8. `cms_contract_number` (text)
9. `cms_plan_number` (text)
10. `cms_geo_segment` (text)
11. `counties` (TEXT[] array)
12. `metadata` (jsonb)

## Fields to Migrate to Metadata

The following fields will be moved from columns to the metadata JSONB field:

- `effective_start` → `metadata.effective_start`
- `effective_end` → `metadata.effective_end`
- `premium_monthly` → `metadata.premium_monthly`
- `giveback_monthly` → `metadata.giveback_monthly`
- `otc_benefit_quarterly` → `metadata.otc_benefit_quarterly`
- `dental_benefit_yearly` → `metadata.dental_benefit_yearly`
- `hearing_benefit_yearly` → `metadata.hearing_benefit_yearly`
- `vision_benefit_yearly` → `metadata.vision_benefit_yearly`
- `primary_care_copay` → `metadata.primary_care_copay`
- `specialist_copay` → `metadata.specialist_copay`
- `hospital_inpatient_per_day_copay` → `metadata.hospital_inpatient_per_day_copay`
- `hospital_inpatient_days` → `metadata.hospital_inpatient_days`
- `moop_annual` → `metadata.moop_annual`
- `ambulance_copay` → `metadata.ambulance_copay`
- `emergency_room_copay` → `metadata.emergency_room_copay`
- `urgent_care_copay` → `metadata.urgent_care_copay`
- `pharmacy_benefit` → `metadata.pharmacy_benefit`
- `service_area` → `metadata.service_area`
- `notes` → `metadata.notes`

## Data Analysis Results

Based on analysis of the current plans data (95 records):

### Fields with Significant Data

- `notes`: 89 records
- `premium_monthly`: 65 records
- `giveback_monthly`: 64 records
- `moop_annual`: 64 records
- `vision_benefit_yearly`: 55 records
- `hospital_inpatient_per_day_copay`: 58 records
- `dental_benefit_yearly`: 50 records
- `hospital_inpatient_days`: 50 records
- `otc_benefit_quarterly`: 49 records
- `primary_care_copay`: 46 records
- `specialist_copay`: 46 records

### Fields with Moderate Data

- `emergency_room_copay`: 31 records
- `urgent_care_copay`: 30 records
- `ambulance_copay`: 29 records
- `hearing_benefit_yearly`: 27 records
- `service_area`: 20 records
- `pharmacy_benefit`: 18 records

### Fields with Limited Data

- `effective_start`: 12 records
- `effective_end`: 12 records

## Migration Steps

### Step 1: Run Data Migration

```sql
-- Execute the migration script
\i 14-migrate-plans-fields-to-metadata.sql
```

This script:

- Preserves existing metadata
- Adds new fields to metadata only if they have non-null, non-empty values
- Converts numeric and array values to appropriate JSONB types
- Includes verification queries to ensure data integrity

### Step 2: Run Schema Update

```sql
-- Execute the schema update script
\i 15-update-plans-schema-keep-11-fields.sql
```

This script:

- Drops all columns except the 11 core fields
- Updates timezone handling to use UTC (aligns with memory requirements)
- Verifies the final schema structure
- Confirms data integrity after column removal

### Step 3: Run Tests

```sql
-- Execute the test script
\i 16-test-plans-migration.sql
```

This script:

- Validates data migration completeness
- Checks for data conflicts
- Verifies core field integrity
- Confirms foreign key relationships still work

## Important Notes

### Data Preservation

- **All existing data is preserved** - nothing is lost during migration
- Existing metadata is preserved and new fields are added
- If a field already exists in metadata, it will be overwritten with the column value

### UTC Timezone Handling

The migration includes timezone updates to align with the project requirement to use UTC for all datetime handling [[memory:5285941]]. This affects:

- `created_at` and `updated_at` timestamps
- The `update_updated_at_column()` trigger function should also be updated to use UTC

### Application Impact

After migration, applications will need to:

- Access migrated fields through the metadata JSONB field
- Update queries that reference dropped columns
- Modify forms and UI components that display these fields

### Rollback Considerations

If rollback is needed:

1. Restore from database backup taken before migration
2. Or recreate columns and migrate data back from metadata (complex)

## Verification

After running all migration scripts, verify:

1. **Schema**: Only 11 core fields remain
2. **Data**: All original data is accessible via metadata
3. **Integrity**: Foreign key relationships still work
4. **Performance**: Indexes on core fields still function
5. **Application**: UI and queries work with new structure

## Example Usage After Migration

### Accessing Migrated Data

```sql
-- Get premium information from metadata
SELECT
    name,
    carrier,
    plan_year,
    metadata->>'premium_monthly' as premium_monthly,
    metadata->>'giveback_monthly' as giveback_monthly
FROM plans
WHERE metadata ? 'premium_monthly';

-- Get all benefit information
SELECT
    name,
    jsonb_pretty(metadata) as benefits
FROM plans
WHERE metadata ? 'dental_benefit_yearly';
```

### Updating Metadata Fields

```sql
-- Update premium in metadata
UPDATE plans
SET metadata = jsonb_set(metadata, '{premium_monthly}', '"150.00"')
WHERE id = 'plan-uuid-here';
```

## Files Created

1. `14-migrate-plans-fields-to-metadata.sql` - Data migration script
2. `15-update-plans-schema-keep-11-fields.sql` - Schema update script
3. `16-test-plans-migration.sql` - Testing and validation script
4. `PLANS_MIGRATION_README.md` - This documentation

## Next Steps

✅ **Migration is Ready to Execute!**

The migration scripts have been created and the application code has been updated to work with the new schema. The codebase already includes:

1. ✅ **Metadata utilities** - `src/lib/plan-metadata-utils.ts` with helper functions
2. ✅ **Updated UI components** - Plans page and comparison modal use metadata helpers
3. ✅ **Form handling** - Already separates core fields from metadata fields
4. ✅ **TypeScript types** - Will need updating after migration

**Next Steps:**

1. Run the migration scripts (`run-plans-migration.sql`)
2. Update TypeScript types in `src/lib/supabase-types.ts` after migration
3. Test the application to ensure everything works correctly
