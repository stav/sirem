# Supabase Data Dump

This script allows you to export all your Supabase data to JSON files for backup or migration purposes.

## Prerequisites

1. Make sure you have a `.env.local` file in your project root with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. Ensure you have the required dependencies installed:
   ```bash
   npm install
   ```

## How to Run

### Option 1: Using npm script (Recommended)
```bash
npm run dump-data
```

### Option 2: Direct execution
```bash
node supabase-dump.mjs
```

## What Gets Exported

The script will dump all data from the following tables:
- `tag_categories` - Tag categories for organizing contacts
- `tags` - Individual tags that can be applied to contacts
- `lead_statuses` - Status options for leads
- `contacts` - Main contact information
- `addresses` - Contact addresses
- `phones` - Contact phone numbers
- `emails` - Contact email addresses
- `contact_tags` - Junction table linking contacts to tags
- `reminders` - Reminders associated with contacts
- `activities` - Activity history for contacts

## Output

The script creates a timestamped directory in the `data/` folder (e.g., `data/supabase-dump-2024-01-15T10-30-45`) containing:
- Individual JSON files for each table (e.g., `contacts.json`, `reminders.json`)
- A `dump-summary.json` file with metadata about the dump

### Example Output Structure
```
data/
└── supabase-dump-2024-01-15T10-30-45/
    ├── contacts.json
    ├── reminders.json
    ├── addresses.json
    ├── phones.json
    ├── emails.json
    ├── tag_categories.json
    ├── tags.json
    ├── contact_tags.json
    ├── lead_statuses.json
    ├── activities.json
    └── dump-summary.json
```

### Benefits of Timestamped Directories
- **No overwrites**: Each dump creates a new directory
- **Historical tracking**: Keep multiple versions for comparison
- **Easy cleanup**: Remove old dumps when no longer needed
- **Clear organization**: Each dump is clearly dated and timestamped

## Troubleshooting

### Missing Environment Variables
If you get an error about missing Supabase credentials:
1. Check that your `.env.local` file exists in the project root
2. Verify that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly
3. Make sure there are no extra spaces or quotes around the values

### Permission Errors
If you get permission errors when creating the output directory:
1. Make sure you have write permissions in the current directory
2. Try running the script from a different location

### Network Issues
If the script fails to connect to Supabase:
1. Check your internet connection
2. Verify your Supabase URL is correct
3. Ensure your Supabase project is active and accessible

## Data Format

Each JSON file contains an array of objects representing the table records. For example:

```json
[
  {
    "id": "uuid-here",
    "created_at": "2024-01-01T00:00:00.000Z",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com"
  }
]
```

## Security Note

⚠️ **Important**: The dumped data contains sensitive information. Make sure to:
- Store the dump files securely
- Don't commit them to version control
- Delete them when no longer needed
- Consider encrypting the files if storing them long-term

## Restoring Data

To restore data from a dump, you would need to:
1. Parse the JSON files
2. Use Supabase's insert methods to recreate the records
3. Handle foreign key relationships carefully
4. Consider using Supabase's bulk insert features for large datasets

Note: This script is for data export only. A separate restore script would be needed for importing data back to Supabase.

## Managing Multiple Dumps

### Listing All Dumps
```bash
ls -la data/supabase-dump-*/
```

### Finding the Latest Dump
```bash
ls -dt data/supabase-dump-*/ | head -1
```

### Cleaning Up Old Dumps
```bash
# Remove dumps older than 30 days
find data/supabase-dump-*/ -type d -mtime +30 -exec rm -rf {} \;

# Remove all dumps except the 5 most recent
ls -t data/supabase-dump-*/ | tail -n +6 | xargs rm -rf
```

### Comparing Dumps
You can compare data between different dumps by examining the `dump-summary.json` files or comparing specific table files. 
