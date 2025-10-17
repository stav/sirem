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
- **Command**: `npx supabase db dump --linked --file data/schema/current-schema.sql`

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

### Getting Help

1. Check the [Supabase CLI documentation](https://supabase.com/docs/guides/cli)
2. Review the project's `package.json` scripts
3. Check the `scripts/supabase-dump.mjs` file for data dump logic
4. Ensure your `.env.local` file is properly configured

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
