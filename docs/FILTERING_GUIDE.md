# Filtering Guide

This document provides a comprehensive guide to the filtering system used in the Sirem CRM application, specifically on the Manage page.

## Overview

The filtering system allows users to quickly find contacts using multiple filter types that can be combined for precise results. All filters use a space-separated format and support partial matching.

## Filter Types

### 1. Name Filtering

**Format**: `[name]` (no prefix required)  
**Description**: Searches through first name and last name fields  
**Case**: Case-insensitive partial matching

**Examples**:

- `john` - finds contacts with "John" in first or last name
- `smith` - finds contacts with "Smith" in first or last name
- `jane doe` - finds contacts with both "Jane" and "Doe" in their names

### 2. T65 Days Filtering

**Format**: `[number]` (numeric values only)  
**Description**: Filters contacts based on days before/after their 65th birthday  
**Logic**: Shows contacts within the specified number of days of turning 65

**Examples**:

- `30` - contacts within 30 days of their 65th birthday (before or after)
- `7` - contacts within 7 days of their 65th birthday
- `90` - contacts within 90 days of their 65th birthday

**Special Behavior**: When T65 filters are used, results are automatically sorted by proximity to 65th birthday (closest to zero first).

### 3. Tag Filtering

**Format**: `t:[tag_name]`  
**Description**: Filters contacts by assigned tags  
**Case**: Case-insensitive partial matching

**Examples**:

- `t:priority` - contacts with tags containing "priority"
- `t:follow` - contacts with tags containing "follow"
- `t:urgent` - contacts with tags containing "urgent"

### 4. Status Filtering

**Format**: `s:[status_name]`  
**Description**: Filters contacts by their current status  
**Case**: Case-insensitive partial matching

**Examples**:

- `s:new` - contacts with "new" status
- `s:active` - contacts with "active" status
- `s:follow` - contacts with status containing "follow"

### 5. Role Filtering

**Format**: `r:[role_type]`  
**Description**: Filters contacts by their assigned roles  
**Case**: Case-insensitive partial matching  
**Note**: Only considers active roles

**Available Role Types**:

- `r:medicare_client` - Medicare clients
- `r:referral_partner` - Referral partners
- `r:tire_shop` - Tire shop contacts
- `r:dentist` - Dentist contacts
- `r:presentation_partner` - Presentation partners
- `r:other` - Other role types

**Examples**:

- `r:medicare` - contacts with Medicare-related roles
- `r:referral` - contacts with referral-related roles
- `r:client` - contacts with client-related roles

## Combining Filters

Multiple filters can be combined using spaces. The system uses **OR logic** between different filter terms, meaning a contact will appear if it matches ANY of the specified criteria.

### Basic Combinations

**Name + Status**:

```
john s:new
```

Finds contacts named "John" OR contacts with "new" status

**Tag + Role**:

```
t:priority r:medicare_client
```

Finds contacts with "priority" tag OR Medicare client role

**T65 + Status**:

```
30 s:active
```

Finds contacts within 30 days of 65th birthday OR contacts with "active" status

### Complex Combinations

**Multiple Criteria**:

```
john t:priority s:new r:medicare_client
```

Finds contacts that match ANY of:

- Name contains "john"
- Has "priority" tag
- Has "new" status
- Has Medicare client role

**Targeted Search**:

```
t:urgent r:referral_partner
```

Finds contacts that are either urgent OR referral partners

## Filter Helper

The Filter Helper provides quick access to common filter values:

### Status Filters

- Dynamically loads all unique statuses from the database
- Click any status button to add `s:[status]` to the filter

### Role Filters

- Shows all available role types
- Click any role button to add `r:[role_type]` to the filter
- Displays role types in user-friendly format (e.g., "medicare client" instead of "medicare_client")

## Best Practices

### 1. Start Broad, Then Narrow

Begin with general filters and add more specific ones:

```
medicare r:medicare_client s:new
```

### 2. Use T65 for Age-Related Searches

For Medicare-related work, T65 filters are very useful:

```
30 r:medicare_client
```

Finds Medicare clients turning 65 within 30 days

### 3. Combine Related Filters

Group related criteria for better results:

```
t:priority s:urgent
```

Finds high-priority, urgent contacts

### 4. Use Partial Matching

Take advantage of partial matching for flexibility:

```
r:medicare s:new
```

Instead of the full `r:medicare_client s:new`

## Common Use Cases

### Finding New Medicare Clients

```
r:medicare_client s:new
```

### Upcoming 65th Birthdays

```
30
```

### High Priority Contacts

```
t:priority s:urgent
```

### Referral Partners to Follow Up

```
r:referral_partner s:follow
```

### All Active Contacts

```
s:active
```

### Contacts with Specific Tags

```
t:follow t:priority
```

## Technical Notes

### Filter Processing

1. Filters are parsed as space-separated terms
2. Each term is processed according to its type (prefix-based)
3. Contact IDs matching any term are collected
4. Results are filtered to show only matching contacts
5. T65 filters trigger special sorting by proximity to 65th birthday

### Performance Considerations

- Filters use efficient Set-based matching
- T65 calculations are performed on-demand
- Role filtering only considers active roles
- Tag and status filtering use partial matching for flexibility

### Data Requirements

- **T65 Filtering**: Requires valid `birthdate` field
- **Tag Filtering**: Requires `contact_tags` relationship
- **Role Filtering**: Requires `contact_roles` relationship with `is_active` field
- **Status Filtering**: Requires `status` field

## Troubleshooting

### No Results Found

- Check for typos in filter terms
- Verify that the data exists (e.g., contacts have roles assigned)
- Try broader partial matches (e.g., `r:medicare` instead of `r:medicare_client`)

### Unexpected Results

- Remember that filters use OR logic between terms
- Check if T65 sorting is affecting the order
- Verify that role filtering only considers active roles

### Filter Helper Not Working

- Ensure the database connection is active
- Check that roles are properly configured in the system
- Verify that contacts have the required relationships loaded
