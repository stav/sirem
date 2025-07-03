# Database Schema

This directory contains all database schema definitions and migrations for the Sirem CRM system.

## Schema Files

### Core Schema

- **`01-initial-schema.sql`** - Initial database setup with all core tables
- **`02-add-phone-email-fields.sql`** - Migration to add phone/email fields to contacts
- **`03-add-status-field.sql`** - Migration to add status field to contacts

## Database Structure

### Core Tables

#### `contacts` - Main contact information

- Primary contact data including Medicare-specific fields
- Links to addresses, phones, emails, reminders, and activities
- Contains business logic fields like lead status and policy counts

#### `addresses` - Contact addresses

- Multiple addresses per contact
- Includes geocoding data (latitude/longitude)
- County and FIPS code support

#### `phones` - Contact phone numbers

- Multiple phone numbers per contact
- SMS compatibility tracking
- Phone type labeling

#### `emails` - Contact email addresses

- Multiple email addresses per contact
- Email type labeling
- Inactive status tracking

#### `reminders` - Contact reminders

- Task management for contacts
- Priority levels (low/medium/high)
- Completion tracking

#### `activities` - Contact activity history

- Activity logging and tracking
- Duration and outcome recording
- Metadata support for custom fields

### Reference Tables

#### `lead_statuses` - Lead status options

- Predefined status values
- Color coding support
- Description fields

#### `tag_categories` - Tag organization

- Hierarchical tag categories
- Color coding
- Active/inactive status

#### `tags` - Individual tags

- Tag labels within categories
- Icon URL support
- Metadata for custom properties

#### `contact_tags` - Contact-tag relationships

- Many-to-many relationship
- Interaction URL tracking
- Metadata support

## Migration Strategy

### Naming Convention

- Files are numbered sequentially: `01-`, `02-`, etc.
- Descriptive names indicate the purpose
- Each migration is self-contained

### Running Migrations

1. Execute files in numerical order
2. Each migration should be idempotent (safe to run multiple times)
3. Test migrations in development before production

### Best Practices

- Always use `IF NOT EXISTS` for new columns/tables
- Include rollback instructions in comments
- Test migrations with sample data
- Document breaking changes

## Schema Evolution

### Version History

- **v1.0** - Initial schema with core tables
- **v1.1** - Added phone/email fields to contacts
- **v1.2** - Added status field with lead status integration

### Future Considerations

- Consider adding database triggers for data consistency
- Implement proper foreign key constraints
- Add database-level validation rules
- Consider partitioning for large tables

## Security

### Row Level Security (RLS)

All tables have RLS enabled with public access policies. In production:

- Implement proper authentication
- Create user-specific policies
- Audit access patterns

### Data Protection

- Sensitive data should be encrypted
- Implement proper backup strategies
- Consider data retention policies

## Performance

### Indexes

Key indexes are created for:

- Foreign key relationships
- Frequently queried fields
- Date-based queries
- Status filtering

### Optimization Tips

- Monitor query performance
- Add indexes for slow queries
- Consider materialized views for complex reports
- Implement proper connection pooling

## Backup and Recovery

### Schema Backup

```bash
# Export current schema
pg_dump --schema-only your_database > schema-backup.sql
```

### Data Backup

Use the data dump script:

```bash
npm run dump-data
```

### Recovery

1. Restore schema from backup
2. Run migrations in order
3. Restore data from JSON dumps
4. Verify data integrity

## Development Workflow

### Adding New Tables

1. Create new migration file with next number
2. Include table definition and indexes
3. Add RLS policies
4. Update this README
5. Test in development

### Modifying Existing Tables

1. Create migration file for changes
2. Use `ALTER TABLE` statements
3. Include data migration if needed
4. Test thoroughly
5. Document changes

### Schema Validation

- Use database constraints
- Implement application-level validation
- Regular schema audits
- Performance monitoring
