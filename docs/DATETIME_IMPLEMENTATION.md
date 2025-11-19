# DateTime Implementation Guide

## Overview

The Sirem CRM system uses proper timezone handling: **UTC in the database, EST in the UI**. This follows industry best practices while providing a simple user experience for Eastern Time users.

## Implementation Details

### Database Schema

- All date/time fields use PostgreSQL `timestamp with time zone` type
- Fields: `created_at`, `updated_at`, `start_date`, `end_date`, `completed_date`
- **All timestamps are stored in UTC** (real UTC, not EST masquerading as UTC)
- Table defaults and triggers use `timezone('utc'::text, now())`

### Frontend Components

#### DateTimeInput Component

- **Location**: `src/components/ui/datetime-input.tsx`
- **Input Type**: HTML `datetime-local` input
- **Format**: `YYYY-MM-DDTHH:MM` (EST time displayed to user)
- **Features**:
  - Clear button (X) to reset the field
  - "Now" button (clock icon) to set current EST time
  - Automatic conversion between UTC (storage) and EST (display/input)

#### Utility Functions

- **Location**: `src/lib/utils.ts`
- **`formatDateTime()`**: Converts UTC to EST and formats as `YYYY-MM-DD HH:MM` for display
- **`formatDateTimeForInput()`**: Converts UTC to EST and formats as `YYYY-MM-DDTHH:MM` for input fields
- **`estDateTimeLocalToUTC()`**: Converts EST datetime-local string to UTC ISO string for storage
- **`getLocalTimeAsUTC()`**: Gets current EST time and converts to UTC ISO string

### Data Flow

1. **User Input**: User selects date/time via datetime-local input (EST time)
2. **Form Handling**: DateTimeInput converts EST to UTC ISO string
3. **Database Storage**: UTC ISO string stored in PostgreSQL timestamp field
4. **Display**: Utility functions convert UTC to EST and display EST time components

### Timezone Handling

The system uses proper timezone conversion:

- **Storage**: All times stored as **real UTC** in the database
- **Display**: UTC times converted to **EST** for display
- **Input**: User enters **EST** time, converted to UTC for storage
- **Conversion**: Uses `Intl.DateTimeFormat` with `America/New_York` timezone
- **DST**: Automatically handles Eastern Daylight Time (EDT) transitions

### Components Updated

#### ActionForm (`src/components/ActionForm.tsx`)

- Replaced `DateInput` with `DateTimeInput` for all date fields
- Updated labels to indicate date & time selection
- All fields now support time selection: start_date, end_date, completed_date

#### ActionCard (`src/components/ActionCard.tsx`)

- Updated to display full datetime information
- Uses `formatDateTime()` utility for consistent formatting
- Shows time for all date fields in tooltips and display

#### ActionViewModal (`src/components/ActionViewModal.tsx`)

- Updated to display full datetime information
- Consistent formatting across all date fields

### Benefits of This Approach

1. **Industry Standard**: Follows best practices (UTC storage, local display)
2. **User-Friendly**: Users see and enter times in their local timezone (EST)
3. **Accurate**: Proper timezone conversion handles DST automatically
4. **Scalable**: Easy to extend to support multiple timezones in the future
5. **Integration-Ready**: Real UTC timestamps work correctly with external systems
6. **Maintainable**: Clear separation between storage (UTC) and presentation (EST)

### Usage Examples

#### Creating an Action with DateTime

```typescript
// User enters: 2:30 PM EST on Jan 15, 2024
// DateTimeInput converts to UTC: "2024-01-15T19:30:00.000Z" (EST is UTC-5 in winter)
const actionData = {
  title: 'Follow up call',
  start_date: '2024-01-15T19:30:00.000Z', // Stored as UTC
  end_date: '2024-01-15T20:00:00.000Z', // Stored as UTC
  // ... other fields
}
```

#### Displaying DateTime

```typescript
import { formatDateTime } from '@/lib/utils'

// Input (UTC): "2024-01-15T19:30:00.000Z"
// Output (EST): "2024-01-15 14:30" (converted back to EST for display)
const displayTime = formatDateTime(action.start_date)
```

### Migration Notes

- **Migration 21** (`21-update-timezone-to-utc.sql`) updates all table defaults to use real UTC
- **Migration 09** already uses UTC for the `update_updated_at_column()` trigger function
- Existing data timestamps remain unchanged (only defaults for new records are updated)
- The frontend conversion functions handle both old and new data formats

### Timezone Conversion Details

The system uses JavaScript's `Intl.DateTimeFormat` API for accurate timezone conversion:

- **UTC to EST**: Uses `formatToParts()` to extract EST components from UTC dates
- **EST to UTC**: Uses iterative adjustment to find the UTC time that converts to the target EST time
- **DST Handling**: `America/New_York` timezone automatically handles EST/EDT transitions
- **Accuracy**: All conversions are precise to the second

### Future Considerations

To support multiple user timezones:

1. Store user timezone preference in user profile
2. Update `APP_TIMEZONE` constant to use user's timezone
3. Add timezone indicator to display (e.g., "2:30 PM EST")
4. Consider using a timezone library (like `date-fns-tz`) for more complex scenarios

The current implementation provides a solid, standards-compliant foundation that can be extended when needed.
