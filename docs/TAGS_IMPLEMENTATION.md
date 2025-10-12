# Tags Implementation Guide

This document describes the complete tagging system implementation in Sirem CRM, including database schema, UI components, and usage patterns.

## Overview

The tagging system provides a flexible way to organize and categorize contacts using a hierarchical structure of tag categories and tags. This system supports:

- **Many-to-many relationships** between contacts and tags
- **Hierarchical organization** with tag categories
- **Real-time UI updates** for all CRUD operations
- **Contact filtering** using tag-based search
- **Visual organization** with color-coded categories

## Database Schema

### Core Tables

#### `tag_categories`
```sql
CREATE TABLE tag_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#A9A9A9',
  is_active BOOLEAN DEFAULT true,
  parent_category_id UUID REFERENCES tag_categories(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `tags`
```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES tag_categories(id),
  icon_url TEXT,
  metadata JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `contact_tags` (Junction Table)
```sql
CREATE TABLE contact_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contact_id, tag_id)
);
```

### Relationships

- **Tag Categories** → **Tags**: One-to-many (one category can have many tags)
- **Tags** → **Contacts**: Many-to-many (via `contact_tags` junction table)
- **Tag Categories** → **Tag Categories**: Self-referential (for hierarchical categories)

## Implementation Architecture

### Hooks

#### `useTags` (Global Hook)
- **Location**: `src/hooks/useTags.ts`
- **Purpose**: General-purpose tag operations used across the application
- **Features**: CRUD operations for tags and categories, contact-tag assignments

#### `useTagsPage` (Isolated Hook)
- **Location**: `src/hooks/useTagsPage.ts`
- **Purpose**: Dedicated hook for the Tags management page
- **Features**: Real-time UI updates, isolated state management
- **Why Separate**: Prevents state synchronization issues between components

### Components

#### `TagPicker`
- **Location**: `src/components/TagPicker.tsx`
- **Purpose**: Multi-select tag assignment interface for contacts
- **Features**:
  - Searchable command palette
  - Grouped by category with color indicators
  - Real-time database updates
  - Memoized for performance

#### `TagForm`
- **Location**: `src/components/TagForm.tsx`
- **Purpose**: Create/edit individual tags
- **Features**:
  - Category selection dropdown
  - Icon URL and metadata fields
  - Form validation

#### `CategoryForm`
- **Location**: `src/components/CategoryForm.tsx`
- **Purpose**: Create/edit tag categories
- **Features**:
  - Color picker with predefined options
  - Parent category selection
  - Active/inactive toggle

#### Tags Management Page
- **Location**: `src/app/tags/page.tsx`
- **Purpose**: Admin interface for managing tags and categories
- **Features**:
  - Real-time CRUD operations
  - Visual category cards with tag counts
  - Expandable tag lists

## Usage Patterns

### Contact Tag Assignment

#### In Contact View Modal
```tsx
// ContactBasicInfo component includes TagPicker
<TagPicker
  contactId={contact.id}
  selectedTagIds={tags.map((t) => t.id)}
  onTagsChange={handleTagsChange}
/>
```

#### In Contact Edit Form
```tsx
// ContactForm includes TagPicker for existing contacts
{editingContact && (
  <TagPicker
    contactId={editingContact.id}
    selectedTagIds={contactTagIds}
    onTagsChange={(tagIds) => {
      setContactTagIds(tagIds)
      if (onRefreshContact) {
        onRefreshContact()
      }
    }}
  />
)}
```

### Tag Filtering

The system supports tag-based filtering using the format `t:tagname`:

- **`t:n2m`** → Shows contacts tagged with "n2m"
- **`t:referral`** → Shows contacts tagged with "referral"
- **`mary t:giant`** → Shows contacts with "mary" in name AND tagged with "giant"

### Navigation

Tags management is accessible via:
- **URL**: `/tags`
- **Navigation**: "Tags" link in the main navigation
- **Icon**: Tags icon (lucide-react)

## Key Features

### Real-Time Updates
- All CRUD operations update the UI immediately
- No page refresh required
- Consistent state across all components

### Performance Optimizations
- **Memoized components** to prevent unnecessary re-renders
- **Isolated hooks** to prevent state synchronization issues
- **Efficient queries** with proper indexing

### User Experience
- **Visual indicators** with color-coded categories
- **Search functionality** in tag picker
- **Grouped display** by category
- **Responsive design** for all screen sizes

### History Logging
- **Automatic logging** of tag additions and removals
- **Contact history** tracks all tag changes with timestamps
- **Detailed information** includes contact name and tag name
- **Audit trail** for compliance and tracking purposes

## Common Operations

### Creating a New Category
1. Navigate to `/tags`
2. Click "New Category"
3. Enter category name and select color
4. Click "Create Category"
5. Category appears immediately in the UI

### Creating a New Tag
1. Navigate to `/tags`
2. Click "+ New Tag"
3. Enter tag label and select category
4. Optionally add icon URL or metadata
5. Click "Create Tag"
6. Tag appears immediately in the category

### Assigning Tags to Contacts
1. Open contact view or edit modal
2. Click "Edit" button in the Tags section
3. Use the tag picker to select/deselect tags
4. Changes are saved immediately to the database
5. Tag changes are automatically logged to contact history

### Filtering by Tags
1. In the contact list, use the filter input
2. Type `t:tagname` to filter by specific tags
3. Combine with other filters: `john t:referral 90`

## Troubleshooting

### Common Issues

#### UI Not Updating After Changes
- **Cause**: State synchronization issues between hooks
- **Solution**: Use the isolated `useTagsPage` hook for the Tags management page

#### Tag Picker Appearing Behind Modal
- **Cause**: Z-index layering issues
- **Solution**: Tag picker uses `z-[70]` class for proper layering

#### Infinite Loop in Network Requests
- **Cause**: Improper dependency arrays in useEffect hooks
- **Solution**: Use `useCallback` for stable function references

### Debug Information

Enable console logging to debug issues:
- `useTagsPage fetchCategories: Received data: X categories`
- `useTagsPage Category created successfully, refreshing categories list...`
- `TagsPage render - categories: X [category names]`

## Future Enhancements

### Potential Improvements
- **Bulk tag operations** for multiple contacts
- **Tag analytics** and usage statistics
- **Tag templates** for common tag sets
- **Advanced filtering** with tag combinations
- **Tag-based workflows** and automation

### Technical Considerations
- **Database indexing** on frequently queried fields
- **Caching strategies** for large tag datasets
- **Migration tools** for tag data restructuring
- **API endpoints** for external tag management

## Related Documentation

- [Component Architecture](./COMPONENT_ARCHITECTURE.md)
- [Database Schema](../data/schema/README.md)
- [Filtering Guide](./FILTERING_GUIDE.md)
- [Main README](../README.md)
