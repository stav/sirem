# Sirem CRM

A modern Medicare CRM system built with Next.js, TypeScript, and Supabase.

## Features

- **Contact Management**: Complete contact profiles with Medicare-specific fields
- **Activity Tracking**: Log and track all interactions with contacts
- **Reminder System**: Task management with priority levels and due dates
- **Tagging System**: Hierarchical tags for organizing contacts
- **Data Import**: Import data from Integrity CRM system
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS

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
- `activities` - Activity/interaction history
- `reminders` - Task management
- `addresses`, `phones`, `emails` - Contact details
- `tags`, `tag_categories` - Organization system
- `lead_statuses` - Status tracking

See `data/schema/` for complete schema definitions.

## License

MIT
