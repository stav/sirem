# Medicaid Refactor – Phase Summary

## Phase 1 Recap – Hybrid Foundation

- Reworked `plans-metadata-schema.ts` to adopt the Characteristics + Tags approach.
  - Added `characteristics` blocks to all base fields and variants.
  - Converted Medicaid/LIS fields into true variants and removed redundant entries.
  - Trimmed variant characteristics to override only what differs (eligibility, modifier, unit).
  - Introduced schema builder helpers that enforce characteristic enumerations (frequency, eligibility tokens, units) for use in the upcoming field builder UI.
- Updated runtime utilities to respect the new schema structure.
  - `schema-parser` exposes `characteristics`, `variants`, and now annotates variant definitions with their merged characteristics and `baseKey`.
  - `plan-metadata-utils` rebuilt `getAllExpectedFieldKeys`, legacy-field handling, metadata builders, and default form population to include variants.
- Dynamic plan form now surfaces legacy/custom metadata and handles zero values correctly.
- Plan edit workflow logs sorted metadata payloads for easier debugging.

## Phase 2 Recap – Resolver + Tests

- Introduced `plan-field-resolution.ts`, a centralized resolver that selects the best field (variant vs. base) based on eligibility context.
  - Handles direct variant lookups, fallback to base, and multi-eligibility contexts.
  - Returns provenance (`variant`, `base`, `missing`) for debugging and analytics.
- Wired resolver into `premiumCalculations` (and friends) so callers stop hardcoding variant keys.
- Added Vitest to the toolchain with resolver unit tests covering variant selection, fallbacks, and eligibility arrays.
- Added schema integrity tests ensuring concepts are declared, variant characteristics stay aligned, and prevent accidental overrides.
- Updated tooling (aliases, config) to support test running without warnings.

## Phase 4 Progress – Consumer Audit

- Migrated the plan comparison modal to resolve all metadata via `getResolvedMetadata`, including eligibility toggles and provenance badges.
- Ran a repo-wide sweep for direct `plan.metadata` reads; remaining usages live exclusively inside resolver-aware utilities.
- Added `metadata-audit.test.ts` which fails the build if new runtime modules bypass the resolver helpers.
- Upcoming work: migrate reporting/export scripts to consume the resolver helpers once those surfaces are brought over.

## Current Architecture (Hybrid Characteristics + Tags)

- **Base Schema** (`data/schema/plans-metadata-schema.ts`) is the single source of truth.
  - Each property keeps an explicit `key` which is the persisted metadata field.
  - `characteristics` annotate the semantic dimensions of each field:
    - `concept` (premium, copay, benefit, etc.)
    - `type` (specialist, dental, hospital_inpatient, etc.)
    - `frequency` or `unit` when applicable
    - `eligibility` where the base value is intended (usually `medicare`)
    - `direction` (credit/debit) for finance flows
    - optional `modifier`
  - `tags` are now strictly for grouping/presentation (`['financial', 'cost-sharing']`). They do **not** control eligibility and can be freely extended for UI needs.
- `variants` are ordered arrays (`variants: [{ key: 'premium_monthly_with_extra_help', ... }]`) generated through builder helpers. Variants only override the characteristics that differ (primarily `eligibility`, `modifier`, `unit`, and now `frequency` when a per-stay vs. per-day distinction is required).
- Builder helpers in the schema expose enumerations for field type, frequency, monetary unit, and eligibility (including LIS and Medicaid levels such as QMB, SLMB+, etc.), so the forthcoming UI can present constrained pickers instead of free-form text.

- **Schema Parser** (`src/lib/schema-parser.ts`)
  - Produces `FieldDefinition` objects.
  - Attaches `baseKey` and merged `characteristics` for variant definitions, so consumers know which base field they belong to and have a full view of the characteristics.

- **Resolver Layer** (`src/lib/plan-field-resolution.ts`)
  - Given metadata, a field key, and an eligibility context, it chooses the best value:
    1. If the caller already requested a variant key directly, return it or fall back to its base.
    2. Otherwise, for base keys try to match an eligibility-specific variant (based on `characteristics.eligibility`).
    3. Fall back to the base value if no variant match exists.
  - Returns both the value and its source (`variant`, `base`, or `missing`) so callers can act accordingly.

- **Consumers Updated**
  - Premium/deductible calculations (`plan-metadata-utils.ts`) now call the resolver instead of hard-coded variant checks.
  - Resolver-aware metadata helpers (`getMetadataValue`/`getPlanMetadata`/`getResolvedMetadata`) route every lookup through the resolver so exports/reporting can share the same eligibility logic.
  - Unit tests (`src/lib/__tests__`) cover resolver behavior and schema integrity.

## Phase 3 Goals

1. **Schema Validation Tests (DONE)**
   - Ensure fields with characteristics declare a concept.
   - Ensure variant characteristics only override allowed dimensions and always declare eligibility.

2. **Semantic Consistency**
   - Keep explicit `key` strings aligned with `characteristics`. The new tests enforce the naming discipline; future additions must follow the same pattern.

3. **Documentation** (this file)
   - Capture the rationale for the hybrid model before continuing to later phases.

## Upcoming Phases

- **Phase 4**: Finish migrating exports/reporting/API consumers to the resolver helpers; polish metadata editing for variants and legacy fields.
- **Phase 5**: Data migration/backfill to populate new variant fields; update reporting pipelines; monitor analytics.
