# Database Synchronization Guide

This guide explains how to keep your local database documentation and types synchronized with your Supabase instance.

## Overview

The Sirem CRM project includes automated scripts to synchronize local files with the live Supabase database. This ensures that your TypeScript types, schema documentation, and data backups are always up-to-date.

## Available Scripts

### Individual Operations

#### `npm run dump-types`
- **Purpose**: Updates TypeScript types from Supabase
- **Updates**: `src/lib/supabase-types.ts`
- **When to use**: After database schema changes, before development
- **Command**: `npx supabase gen types typescript --project-id <PROJECT_ID> > src/lib/supabase-types.ts`

#### `npm run dump-schema`
- **Purpose**: Updates the current database schema file
- **Updates**: `data/schema/current-schema.sql`
- **When to use**: After schema changes, for schema analysis
- **Command**: `node scripts/dump-schema-local.mjs` (custom script using local PostgreSQL tools)

#### `npm run dump-data`
- **Purpose**: Creates a timestamped backup of all table data
- **Updates**: `data/supabase-dump-YYYY-MM-DDTHH-MM-SS/`
- **When to use**: For data backups, data analysis, migration planning
- **Command**: `node scripts/supabase-dump.mjs`

### All-in-One Sync

#### `npm run dump-all`
- **Purpose**: Runs all three sync operations in sequence
- **Updates**: Types, schema, and data backup
- **When to use**: After major database changes, before important deployments
- **Command**: `npm run dump-types && npm run dump-schema && npm run dump-data`

## Workflow Examples

### After Making Database Changes

```bash
# 1. Make your changes in Supabase dashboard or via SQL
# 2. Sync everything locally
npm run dump-all

# 3. Review the changes
git diff src/lib/supabase-types.ts
git diff data/schema/current-schema.sql
```

### Before Starting Development

```bash
# Ensure you have the latest types
npm run dump-types

# Start development
npm run dev
```

### Creating a Data Backup

```bash
# Create a timestamped backup
npm run dump-data

# Check the backup location
ls -la data/supabase-dump-*/
```

### Schema Analysis

```bash
# Get the latest schema
npm run dump-schema

# Compare with previous version
git diff data/schema/current-schema.sql
```

## File Locations

### Generated Files

- **TypeScript Types**: `src/lib/supabase-types.ts`
- **Current Schema**: `data/schema/current-schema.sql`
- **Data Backups**: `data/supabase-dump-YYYY-MM-DDTHH-MM-SS/`

### Configuration

- **Environment Variables**: `.env.local` (contains `SUPABASE_PROJECT_ID`)
- **Scripts**: `package.json` (scripts section)
- **Data Dump Script**: `scripts/supabase-dump.mjs`
- **Schema Dump Script**: `scripts/dump-schema-local.mjs` (custom script to bypass Docker issues)

## Best Practices

### Regular Sync Schedule

1. **Daily**: Run `npm run dump-types` before development
2. **After Changes**: Run `npm run dump-all` after any database modifications
3. **Weekly**: Run `npm run dump-data` for regular backups
4. **Before Deployments**: Run `npm run dump-all` to ensure everything is current

### Version Control

- **Commit Types**: Always commit updated types and schema after database changes
- **Review Changes**: Use `git diff` to review what changed in the database
- **Documentation**: Update relevant documentation when schema changes

### Error Handling

- **Missing Project ID**: Ensure `SUPABASE_PROJECT_ID` is set in `.env.local`
- **Network Issues**: Retry the command if Supabase is temporarily unavailable
- **Permission Issues**: Ensure your Supabase project allows CLI access

## Troubleshooting

### Common Issues

#### "unknown flag: --project-id"
- **Cause**: Using wrong Supabase CLI version
- **Solution**: Update Supabase CLI or use the correct flag syntax

#### "Missing Supabase credentials"
- **Cause**: Missing or incorrect environment variables
- **Solution**: Check `.env.local` file for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### "Permission denied" errors
- **Cause**: Insufficient permissions on Supabase project
- **Solution**: Ensure your account has the necessary permissions

#### "FATAL: {:shutdown, :client_termination}" error
- **Cause**: Connection to Supabase database is terminated during schema dump
- **Error Example**: 
  ```
  pg_dump: error: connection to server at "aws-0-us-east-2.pooler.supabase.com" (3.139.14.59), port 5432 failed: FATAL: {:shutdown, :client_termination}
  error running container: exit 1
  ```
- **Solutions**: 
  - Retry the command: `npm run dump-schema`
  - Try with debug flag: `npx supabase db dump --linked --file data/schema/current-schema.sql --debug`
  - Check Supabase service status
  - Use manual schema creation if needed (see below)

#### "pg_dump: error: aborting because of server version mismatch" error
- **Cause**: Supabase CLI uses Docker containers with outdated PostgreSQL versions
- **Error Example**: 
  ```
  pg_dump: error: aborting because of server version mismatch
  pg_dump: detail: server version: 17.6; pg_dump version: 15.8
  error running container: exit 1
  ```
- **Root Cause**: 
  - The project recently upgraded its Supabase server to PostgreSQL 17.6
  - Supabase CLI recently changed to use Docker containers for database operations
  - The containerized `pg_dump` (version 15.8) is incompatible with PostgreSQL 17.6 servers
- **Solution**: ✅ **RESOLVED** - The project now uses a custom script (`scripts/dump-schema-local.mjs`) that bypasses Docker and uses your local PostgreSQL installation
- **How it works**: 
  - Gets connection details from Supabase CLI's dry-run (which still works)
  - Uses your local `pg_dump` (version 17.6) instead of the containerized version
  - Applies the same filtering and transformations as the original Supabase CLI
  - No changes needed to your workflow - just run `npm run dump-schema` as usual

### Getting Help

1. Check the [Supabase CLI documentation](https://supabase.com/docs/guides/cli)
2. Review the project's `package.json` scripts
3. Check the `scripts/supabase-dump.mjs` file for data dump logic
4. Check the `scripts/dump-schema-local.mjs` file for schema dump logic
5. Ensure your `.env.local` file is properly configured

## Custom Schema Dump Implementation

### Overview

Due to Supabase CLI Docker version compatibility issues, the project uses a custom schema dump script that bypasses Docker and uses your local PostgreSQL installation.

### How It Works

The custom script (`scripts/dump-schema-local.mjs`) performs the following steps:

1. **Connection Setup**: Uses Supabase CLI's dry-run feature to extract connection details
2. **Local PostgreSQL**: Runs `pg_dump` using your local PostgreSQL installation (version 17.6)
3. **Same Filtering**: Applies identical schema filtering and transformations as the original Supabase CLI
4. **Output**: Saves the result to `data/schema/current-schema.sql`

### Benefits

- ✅ **No Version Mismatch**: Uses your local PostgreSQL 17.6 installation
- ✅ **Same Output**: Produces identical results to the original Supabase CLI
- ✅ **No Workflow Changes**: Still use `npm run dump-schema` as usual
- ✅ **Faster Execution**: No Docker overhead
- ✅ **Reliable**: Bypasses Docker container issues

### Technical Details

The script:
- Extracts connection details from `npx supabase db dump --linked --dry-run`
- Uses `spawn()` to run `pg_dump` and `sed` processes
- Applies the same schema exclusions and transformations
- Handles errors gracefully with proper error messages

### Maintenance

If you need to modify the schema dump behavior:
- Edit `scripts/dump-schema-local.mjs`
- The script includes all the same filtering logic as the original Supabase CLI
- Test changes with `npm run dump-schema`

## Integration with Development Workflow

### Pre-commit Hooks

Consider adding a pre-commit hook to ensure types are always current:

```bash
# In .git/hooks/pre-commit
#!/bin/sh
npm run dump-types
git add src/lib/supabase-types.ts
```

### CI/CD Integration

Include sync commands in your deployment pipeline:

```yaml
# Example GitHub Actions step
- name: Sync Database Types
  run: npm run dump-types
```

### Team Collaboration

- **Share Environment**: Ensure all team members have access to the same Supabase project
- **Document Changes**: Always document database changes in commit messages
- **Regular Syncs**: Encourage team members to run sync commands regularly

## Advanced Usage

### Custom Data Dumps

Modify `scripts/supabase-dump.mjs` to:
- Include/exclude specific tables
- Change backup frequency
- Add custom data transformations

### Schema Comparison

Use the schema files to:
- Compare different environments
- Track schema evolution
- Plan migrations

### Automated Backups

Set up cron jobs or scheduled tasks to run `npm run dump-data` regularly for automated backups.
