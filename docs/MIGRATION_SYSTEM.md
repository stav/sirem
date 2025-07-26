# Migration System Documentation

## Overview

The Sirem CRM uses a **manual migration system** for database schema changes. This system is designed to be simple, transparent, and reliable, though it requires manual execution of SQL scripts.

## How Migrations Work

### **Migration Files Structure**

Migrations are stored in `data/schema/` with numbered prefixes:

```
data/schema/
├── 01-initial-schema.sql
├── 02-add-phone-email-fields.sql
├── 03-add-status-field.sql
├── 04-unified-actions-table.sql
├── 05-add-address-type-and-indexes.sql
├── 06-add-address-source-field.sql
├── 07-add-ssn-field.sql
├── 08-add-email-campaigns.sql
├── 08-add-email-campaigns-rollback.sql  ← Rollback script
└── current-schema.sql
```

### **Migration Naming Convention**

- **Forward migrations**: `XX-description.sql` (e.g., `08-add-email-campaigns.sql`)
- **Rollback migrations**: `XX-description-rollback.sql` (e.g., `08-add-email-campaigns-rollback.sql`)

### **Migration Scripts**

The project includes Node.js scripts to help with migration management:

- `scripts/run-email-campaigns-migration.mjs` - Applies the email campaigns migration
- `scripts/rollback-email-campaigns.mjs` - Rolls back the email campaigns migration

## Running Migrations

### **Option 1: Using Migration Scripts (Recommended)**

#### **Apply Migration 08:**

```bash
npm run migrate-campaigns
```

#### **Rollback Migration 08:**

```bash
npm run rollback-campaigns
```

### **Option 2: Manual SQL Execution**

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy the content from the migration file (e.g., `data/schema/08-add-email-campaigns.sql`)
4. Paste and run the SQL

### **Option 3: Using Supabase CLI**

If you have the Supabase CLI installed:

```bash
supabase db push --include-all
```

## Branch Management with Migrations

### **Switching to Master Branch**

When switching to the master branch (which doesn't have email campaigns):

1. **Rollback the migration first:**

   ```bash
   npm run rollback-campaigns
   ```

2. **Switch to master:**

   ```bash
   git checkout master
   ```

3. **The database is now compatible with master branch**

### **Switching Back to Dev Branch**

When switching back to your dev branch:

1. **Switch to dev branch:**

   ```bash
   git checkout dev  # or your feature branch
   ```

2. **Apply the migration:**

   ```bash
   npm run migrate-campaigns
   ```

3. **The database is now compatible with dev branch**

## Migration Best Practices

### **1. Always Create Rollback Scripts**

Every migration should have a corresponding rollback script that can undo all changes.

### **2. Test Migrations in Development**

Always test migrations in a development environment before applying to production.

### **3. Backup Before Major Changes**

Before running migrations that modify existing data:

```sql
-- Create a backup of important tables
CREATE TABLE contacts_backup AS SELECT * FROM contacts;
```

### **4. Use Transaction Blocks**

Wrap migrations in transaction blocks when possible:

```sql
BEGIN;
-- Your migration SQL here
COMMIT;
```

### **5. Check for Existing Objects**

Use `IF NOT EXISTS` and `IF EXISTS` clauses:

```sql
CREATE TABLE IF NOT EXISTS new_table (...);
DROP TABLE IF EXISTS old_table;
```

## Current Migration Status

### **Applied Migrations:**

- `01-initial-schema.sql` - Initial database setup
- `02-add-phone-email-fields.sql` - Added phone/email to contacts
- `03-add-status-field.sql` - Added status field
- `04-unified-actions-table.sql` - Unified actions table
- `05-add-address-type-and-indexes.sql` - Address improvements
- `06-add-address-source-field.sql` - Address source tracking
- `07-add-ssn-field.sql` - SSN field addition

### **Pending Migration:**

- `08-add-email-campaigns.sql` - Email campaign functionality (requires manual application)

## Troubleshooting

### **Common Issues**

#### **1. Migration Script Fails**

If the migration script fails with "exec_sql function not found":

- This is expected behavior
- Use manual SQL execution in Supabase SQL Editor
- The script will show you the SQL content to copy

#### **2. Tables Already Exist**

If you get "table already exists" errors:

- Run the rollback script first: `npm run rollback-campaigns`
- Then re-run the migration: `npm run migrate-campaigns`

#### **3. Foreign Key Constraints**

If you get foreign key constraint errors:

- Check that referenced tables exist
- Ensure data integrity before running migrations

#### **4. Permission Errors**

If you get permission errors:

- Ensure you're using the correct Supabase credentials
- Check that your service role key has the necessary permissions

### **Recovery Procedures**

#### **If Migration Partially Fails:**

1. Check which objects were created successfully
2. Drop any partially created objects
3. Fix the migration script
4. Re-run the migration

#### **If Rollback Fails:**

1. Manually drop tables using SQL Editor
2. Check for any remaining objects
3. Clean up any orphaned data

## Future Improvements

### **Planned Enhancements**

1. **Migration Tracking Table**

   ```sql
   CREATE TABLE migrations (
     id SERIAL PRIMARY KEY,
     name VARCHAR(255) NOT NULL,
     applied_at TIMESTAMP DEFAULT NOW(),
     checksum VARCHAR(64)
   );
   ```

2. **Automated Migration Detection**
   - Script to detect which migrations need to be applied
   - Automatic rollback detection when switching branches

3. **Migration Validation**
   - Checksums to verify migration integrity
   - Pre-flight checks before applying migrations

4. **Better Error Handling**
   - More detailed error messages
   - Automatic rollback on failure

## Migration Commands Reference

| Command                      | Description                        |
| ---------------------------- | ---------------------------------- |
| `npm run migrate-campaigns`  | Apply email campaigns migration    |
| `npm run rollback-campaigns` | Rollback email campaigns migration |
| `npm run show-migrations`    | Show migration status              |

## Related Files

- `data/schema/README.md` - Database schema overview
- `docs/CONVERTKIT_INTEGRATION.md` - Email campaigns feature documentation
- `src/lib/supabase-types.ts` - TypeScript types for database schema
