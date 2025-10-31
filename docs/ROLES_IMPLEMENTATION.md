# Roles-Based Logic Implementation

This document describes the comprehensive roles-based system implemented in commit `3b1a2361c231970d465999cff65f0655965bd2bf`. The system allows contacts to have multiple roles with role-specific data stored in a flexible JSONB structure.

## Overview

The roles system enables contacts to be categorized into different types (Medicare clients, referral partners, tire shops, dentists, presentation partners, etc.) with each role having its own set of fields and data requirements. This provides flexibility for managing different types of business relationships while maintaining data integrity.

## Database Schema

### Contact Roles Table

The core of the roles system is the `contact_roles` table:

```sql
CREATE TABLE public.contact_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contact_id uuid NOT NULL,
    role_type text NOT NULL,
    role_data jsonb DEFAULT '{}'::jsonb,
    is_primary boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('America/New_York'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('America/New_York'::text, now()) NOT NULL
);
```

**Key Features:**

- **Flexible Role Data**: Uses JSONB to store role-specific data, allowing different fields for different role types
- **Primary Role Support**: Each contact can have one primary role marked with `is_primary`
- **Active Status**: Roles can be deactivated without deletion using `is_active`
- **Timezone Handling**: All timestamps use America/New_York timezone [[memory:5285941]]

### Indexes

The system includes optimized indexes for performance:

```sql
-- Contact-based queries
CREATE INDEX idx_contact_roles_contact_id ON public.contact_roles USING btree (contact_id);

-- Role type filtering
CREATE INDEX idx_contact_roles_role_type ON public.contact_roles USING btree (role_type);

-- Active roles filtering
CREATE INDEX idx_contact_roles_active ON public.contact_roles USING btree (is_active) WHERE (is_active = true);

-- JSONB data queries
CREATE INDEX idx_contact_roles_role_data_gin ON public.contact_roles USING gin (role_data);
```

## TypeScript Types and Interfaces

### Core Role Types

```typescript
export type RoleType =
  | 'medicare_client'
  | 'referral_partner'
  | 'tire_shop'
  | 'dentist'
  | 'presentation_partner'
  | 'other'
```

### Role Configuration System

Each role type has a configuration that defines:

- Display label and icon
- Color scheme for UI
- Field definitions with types and validation

```typescript
export interface RoleConfig {
  label: string
  iconComponent: React.ComponentType<{ className?: string }>
  color: string
  fields: RoleField[]
}

export interface RoleField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'date' | 'email' | 'number'
  options?: string[]
  placeholder?: string
  required?: boolean
}
```

### Role-Specific Data Types

Each role type has its own TypeScript interface for type safety:

```typescript
export interface MedicareClientData {
  gender?: string
  height?: string
  weight?: string
  has_medicaid?: string
  part_a_effective?: string
  part_b_effective?: string
  subsidy_level?: string
  marital_status?: string
  is_tobacco_user?: string
  medicare_beneficiary_id?: string
}

export interface ReferralPartnerData {
  company?: string
  referral_type?: string
  commission_rate?: string
  notes?: string
}
// ... other role data types
```

## Role Configuration

### Role Definitions

The system supports six predefined role types, each with specific fields:

#### 1. Medicare Client

- **Icon**: Shield
- **Color**: Blue
- **Fields**: Gender, Medicare Beneficiary ID, Part A/B effective dates, height, weight, Medicaid status, subsidy level, marital status, tobacco usage

#### 2. Referral Partner

- **Icon**: User
- **Color**: Green
- **Fields**: Company, referral type, commission rate, notes

#### 3. Presentation Partner

- **Icon**: Presentation
- **Color**: Indigo
- **Fields**: Organization name, presentation type, contact person, topics, audience size, notes

#### 4. Tire Shop

- **Icon**: Wrench
- **Color**: Orange
- **Fields**: Shop name, location, services, contact person

#### 5. Dentist

- **Icon**: Stethoscope
- **Color**: Purple
- **Fields**: Practice name, specialty, Medicaid acceptance, notes

#### 6. Other

- **Icon**: User
- **Color**: Gray
- **Fields**: Role description, notes

## React Components

### ContactRoleManager

The main component for managing roles on contacts:

```typescript
interface ContactRoleManagerProps {
  editingContact?: Contact | null
  onRefreshContact?: () => void
  pendingRoles?: PendingRole[]
  onPendingRolesChange?: (roles: PendingRole[]) => void
  onRoleFormOpenChange?: (open: boolean) => void
  onEditingRoleChange?: (role: ContactRole | PendingRole | null) => void
  onRoleFormDataChange?: (data: { role_type: RoleType; role_data: RoleData; is_primary: boolean }) => void
  refreshTrigger?: number
}
```

**Features:**

- Displays existing roles with edit/delete actions
- Handles both existing and pending (new) roles
- Supports primary role designation
- Real-time refresh capabilities

### RoleForm

Dynamic form component that renders fields based on role type:

```typescript
interface RoleFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  editingRole: ContactRole | PendingRole | null
  formData: RoleFormData
  setFormData: (data: RoleFormData) => void
  isSubmitting: boolean
}
```

**Features:**

- Dynamic field rendering based on role configuration
- Support for all field types (text, select, textarea, date, etc.)
- Primary role toggle
- Form validation

### ContactRolesDisplay

Component for displaying roles in contact view modals:

```typescript
interface ContactRolesDisplayProps {
  contact: Contact
  refreshTrigger?: number
}
```

**Features:**

- Specialized display for Medicare client data
- Generic display for other role types
- Primary role highlighting
- Real-time data refresh

## Utility Functions

### Role Configuration Utilities

```typescript
// Get configuration for a specific role type
export const getRoleConfig = (roleType: RoleType): RoleConfig

// Get all available role types
export const getAllRoleTypes = (): RoleType[]

// Get display information (label, color)
export const getRoleDisplayInfo = (roleType: RoleType)

// Get fields for a role type
export const getRoleFields = (roleType: RoleType)

// Validate role type
export const isValidRoleType = (roleType: string): roleType is RoleType
```

### Role Data Utilities

```typescript
// Validate role data against configuration
export const validateRoleData = (
  roleType: RoleType,
  data: Record<string, unknown>
): { isValid: boolean; errors: string[] }

// Format role data for display
export const formatRoleData = (roleType: RoleType, data: Record<string, unknown>): Record<string, string>

// Get primary role from a list
export const getPrimaryRole = (roles: Array<{ role_type: RoleType; is_primary?: boolean }>): RoleType | null

// Sort roles by priority (primary first, then by creation date)
export const sortRolesByPriority = <T extends { is_primary?: boolean; created_at?: string }>(roles: T[]): T[]
```

## Integration Points

### Contact Management

Roles are integrated into the contact management system:

1. **Contact Creation**: New contacts can have roles assigned during creation
2. **Contact Editing**: Existing contacts can have roles added, edited, or removed
3. **Contact Display**: Roles are displayed in contact cards and view modals
4. **Contact Filtering**: Roles can be used for filtering and searching contacts

### UI Integration

The roles system integrates with the existing UI components:

1. **Contact Cards**: Display role badges and organization names
2. **Contact Lists**: Show role information in list views
3. **Contact Forms**: Include role management sections
4. **Modal Views**: Dedicated role display components

## Data Flow

### Adding a New Role

1. User clicks "Add Role" button
2. `ContactRoleManager` opens `RoleForm` with default data
3. User selects role type and fills in role-specific fields
4. Form validates data using `validateRoleData`
5. Role is saved to database or added to pending roles
6. UI refreshes to show new role

### Editing an Existing Role

1. User clicks edit button on a role card
2. `ContactRoleManager` opens `RoleForm` with existing data
3. User modifies fields (role type cannot be changed)
4. Form validates updated data
5. Changes are saved to database
6. UI refreshes to show updated role

### Role Display

1. `ContactRolesDisplay` fetches roles for a contact
2. Roles are sorted by priority (primary first)
3. Each role is rendered with appropriate icon and color
4. Role-specific data is displayed using specialized components

## Best Practices

### Role Management

1. **Primary Roles**: Each contact should have at most one primary role
2. **Data Validation**: Always validate role data before saving
3. **Type Safety**: Use TypeScript interfaces for role-specific data
4. **Performance**: Use database indexes for efficient queries

### UI/UX

1. **Visual Consistency**: Use consistent icons and colors for role types
2. **Clear Labeling**: Display role information clearly with proper formatting
3. **Responsive Design**: Ensure role components work on all screen sizes
4. **Accessibility**: Include proper ARIA labels and keyboard navigation

### Data Integrity

1. **Required Fields**: Validate required fields based on role configuration
2. **Data Types**: Ensure data matches expected field types
3. **Cascade Deletion**: Handle role deletion when contacts are deleted
4. **Audit Trail**: Track role changes with timestamps

## Future Enhancements

### Potential Improvements

1. **Role Permissions**: Add role-based access control
2. **Custom Fields**: Allow users to define custom role fields
3. **Role Templates**: Create reusable role templates
4. **Bulk Operations**: Support bulk role assignment and editing
5. **Role Analytics**: Add reporting and analytics for role data
6. **Role Workflows**: Implement role-based business processes

### Technical Considerations

1. **Performance**: Optimize queries for large numbers of roles
2. **Caching**: Implement caching for role configurations
3. **Migration**: Plan for role schema changes and data migration
4. **Testing**: Add comprehensive test coverage for role functionality

## Conclusion

The roles-based system provides a flexible and extensible way to manage different types of contacts and their associated data. The implementation uses modern React patterns, TypeScript for type safety, and a flexible database schema that can accommodate future requirements. The system is designed to be maintainable, performant, and user-friendly while providing the flexibility needed for complex business relationships.
