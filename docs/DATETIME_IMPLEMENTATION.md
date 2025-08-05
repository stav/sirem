# DateTime Implementation Guide

## Overview

The Sirem CRM system uses a simplified datetime approach treating all times as UTC to provide full datetime functionality for action scheduling and tracking.

## Implementation Details

### Database Schema

- All date/time fields use PostgreSQL `timestamp with time zone` type
- Fields: `created_at`, `updated_at`, `start_date`, `end_date`, `completed_date`
- Stored as ISO 8601 datetime strings

### Frontend Components

#### DateTimeInput Component

- **Location**: `src/components/ui/datetime-input.tsx`
- **Input Type**: HTML `datetime-local` input
- **Format**: `YYYY-MM-DDTHH:MM` (local time)
- **Features**:
  - Clear button (X) to reset the field
  - "Now" button (clock icon) to set current date/time
  - Automatic conversion between ISO strings and datetime-local format

#### Utility Functions

- **Location**: `src/lib/utils.ts`
- **`formatDateTime()`**: Formats ISO string to `YYYY-MM-DD HH:MM` for display
- **`formatDateTimeForInput()`**: Formats ISO string to `YYYY-MM-DDTHH:MM` for input fields

### Data Flow

1. **User Input**: User selects date/time via datetime-local input (UTC time)
2. **Form Handling**: DateTimeInput stores time as UTC ISO string
3. **Database Storage**: UTC ISO string stored in PostgreSQL timestamp field
4. **Display**: Utility functions display UTC time components

### Timezone Handling

The system treats all times as UTC for simplicity:

- **Input**: User enters time in UTC format
- **Storage**: Time is stored as UTC ISO string
- **Display**: UTC time components are displayed directly
- **No Conversion**: No timezone conversion needed

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

1. **Simplicity**: No timezone conversion complexity
2. **User-Friendly**: Times appear exactly as entered (in UTC)
3. **Consistent**: All datetime fields use the same UTC format
4. **Future-Proof**: Database schema supports timezone handling if needed later
5. **UTC Time**: All times are treated as UTC for consistency

### Usage Examples

#### Creating an Action with DateTime

```typescript
const actionData = {
  title: 'Follow up call',
  start_date: '2024-01-15T14:30:00.000Z', // 2:30 PM
  end_date: '2024-01-15T15:00:00.000Z', // 3:00 PM
  // ... other fields
}
```

#### Displaying DateTime

```typescript
import { formatDateTime } from '@/lib/utils'

// Input: "2024-01-15T14:30:00.000Z"
// Output: "2024-01-15 14:30"
const displayTime = formatDateTime(action.start_date)
```

### Migration Notes

- Existing date-only data will be displayed with 00:00 time
- New actions will have full datetime functionality
- No database migration required (existing schema supports datetime)
- Backward compatible with existing date-only data

### Future Considerations

If timezone support is needed later:

1. Add timezone selection to DateTimeInput
2. Implement timezone conversion utilities
3. Update display to show timezone indicators
4. Handle daylight saving time transitions

The current implementation provides a solid foundation that can be extended with timezone support when needed.
