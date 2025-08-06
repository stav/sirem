# Sirem CRM

A modern Medicare CRM system built with Next.js, TypeScript, and Supabase.

## Features

- **Contact Management**: Complete contact profiles with Medicare-specific fields
- **Activity Tracking**: Log and track all interactions with contacts
- **Reminder System**: Task management with priority levels and due dates
- **Tagging System**: Hierarchical tags for organizing contacts
- **Enhanced Multi-Filter**: Advanced filtering with T65 days, name search, and tag filtering
- **Data Import**: Import data from Integrity CRM system
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS

## ✅ Enhanced Filter System

The contact list features a powerful multi-filter system that supports combining different filter types with OR logic.

### Filter Types

1. **Numeric Terms** → **T65 Days Filtering**
   - Example: `180`
   - Shows contacts turning 65 within the specified number of days
   - Positive number = days until 65th birthday
   - Results are automatically sorted by T65 days (soonest first)

2. **Alpha Terms** → **Name Search**
   - Example: `john`
   - Searches first and last names (case-insensitive)
   - Partial matches supported

3. **Tag Terms** → **Tag Filtering**
   - Format: `t:tagname`
   - Example: `t:n2m`, `t:giant`, `t:referral`
   - Searches contact tags (case-insensitive, partial matches)

4. **Status Terms** → **Status Filtering**
   - Format: `s:statusname`
   - Example: `s:client`, `s:new`, `s:engaged`
   - Searches contact status (case-insensitive, partial matches)

### Multi-Filter Examples

- **`john`** → Shows contacts with "john" in first/last name
- **`180`** → Shows contacts turning 65 within 180 days (T65 sorted)
- **`t:n2m`** → Shows contacts tagged with "n2m"
- **`mary 90 t:referral`** → Shows contacts matching ANY of:
  - Name contains "mary" OR
  - T65 days between 0 and -90 OR
  - Tagged with "referral"
- **`s:client t:giant`** → Shows contacts matching ANY of:
  - Status contains "client" OR
  - Tagged with "giant"

### Smart Features

- **OR Logic**: Contacts matching ANY filter term are included
- **T65 Sorting**: Automatic sorting by T65 days when numeric filters are present
- **Dynamic Indicators**: Shows active filter types (e.g., "T65 + Name + Tag + Status filter")
- **Partial Matching**: All filters support partial text matching
- **Case Insensitive**: All text filtering is case-insensitive

### Usage Tips

- **Combine filters** for complex searches: `smith 60 t:giant s:client`
- **Use T65 filtering** to find contacts approaching Medicare eligibility
- **Tag prefixes** help organize different filter types in one search
- **Tooltips** on birthdate show detailed T65 days information

## Data Import

The system supports importing data from Integrity CRM exports in two modes:

### Full Import

Imports complete lead records including:

- Contact information (names, addresses, phones, emails)
- Medicare-specific data (Part A/B status, beneficiary ID, etc.)
- Reminders and tasks
- Tags and tag categories
- Lead statuses
- Notes and additional metadata

### Activities Only Import

Imports only activity data for existing contacts:

- Matches activities to existing contacts by phone number, email, or name
- Imports activity history with detailed metadata
- Provides detailed import statistics
- Skips activities for contacts that can't be matched

### How to Import

1. Navigate to the `/import` page
2. Select your import type (Full Import or Activities Only)
3. Upload your Integrity JSON export file
4. Review the preview to ensure data looks correct
5. Click "Import Data" or "Import Activities"
6. Monitor the import progress and results

**Note**: For Activities Only imports, make sure your contacts are already in the database. The system will attempt to match activities to existing contacts using phone numbers, email addresses, or names.

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account and project

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and fill in your Supabase credentials
4. Run the database migrations in your Supabase SQL editor
5. Start the development server: `npm run dev`

### Database Schema

The system uses the following main tables:

- `contacts` - Main contact information
- `actions` - Activity scheduling and history
- `addresses`, `phones`, `emails` - Contact details
- `tags`, `tag_categories` - Organization system
- `lead_statuses` - Status tracking

See `data/schema/` for complete schema definitions.

### Date/Time Handling

The system uses a simplified datetime approach without timezone complexity:

- **Input**: HTML `datetime-local` inputs for date and time selection
- **Storage**: ISO datetime strings stored in PostgreSQL `timestamp with time zone` fields
- **Display**: Local time formatting (YYYY-MM-DD HH:MM) without timezone indicators
- **Timezone**: All times are treated as local time without conversion

This approach keeps the implementation simple while providing full datetime functionality for action scheduling and tracking.

## License

MIT
