# Plan Deletion Guide

## Overview

This guide explains how plan deletion works in the Sirem application and the safeguards in place to prevent data integrity issues.

## Plan Deletion Behavior

### Database Constraints

The `enrollments` table has a foreign key constraint that prevents deletion of plans that are referenced by existing enrollments:

```sql
plan_id UUID REFERENCES plans(id) ON DELETE RESTRICT NOT NULL
```

This constraint ensures data integrity by preventing orphaned enrollment records.

### Application-Level Checks

The application now performs the following checks before attempting to delete a plan:

1. **Pre-deletion Validation**: Checks for existing enrollments before attempting deletion
2. **Detailed Error Messages**: Shows specific information about which contacts have enrollments
3. **Toast Notifications**: Displays user-friendly error messages with enrollment details

### Error Handling

When a plan cannot be deleted due to existing enrollments, the system will:

1. **Check Enrollments**: Query the database for all enrollments linked to the plan
2. **Show Contact Names**: Display the names of contacts who have enrollments (up to 3 names)
3. **Count Information**: Show total enrollment count and active enrollment count
4. **User Guidance**: Provide clear instructions on how to resolve the issue

### Example Error Messages

**Single Plan Deletion:**
```
Cannot delete plan "Humana HMO 2025". It has 2 enrollment(s) (1 active). 
Contact(s): John Smith, Jane Doe. 
Please remove all enrollments first or contact support.
```

**Bulk Plan Deletion:**
```
Cannot delete 2 plan(s): Humana HMO 2025, United PPO 2025. 
These plans have 3 enrollment(s) (2 active). 
Please remove all enrollments first or contact support.
```

## How to Delete a Plan with Enrollments

If you need to delete a plan that has enrollments, you have two options:

### Option 1: Remove Enrollments First (Recommended)

1. Navigate to the contact(s) who have enrollments with the plan
2. Remove or update their enrollments to use a different plan
3. Once all enrollments are removed, the plan can be deleted

### Option 2: Contact Support

If you need to delete a plan with enrollments for administrative reasons, contact support who can help with the process.

## Technical Implementation

### Files Modified

- `src/hooks/usePlans.ts`: Enhanced deletion logic with enrollment checks
- `src/app/plans/page.tsx`: Added toast notifications for better user feedback

### Key Functions

- `deletePlan()`: Single plan deletion with enrollment validation
- `deletePlans()`: Bulk plan deletion with enrollment validation
- `getPlanEnrollments()`: Utility function to fetch enrollments for a plan

### Database Queries

The system uses the following query to check for enrollments:

```sql
SELECT id, enrollment_status, contacts:contact_id(first_name, last_name)
FROM enrollments 
WHERE plan_id = $1
```

## Benefits

1. **Data Integrity**: Prevents orphaned enrollment records
2. **User Experience**: Clear error messages with actionable guidance
3. **Transparency**: Shows exactly which contacts are affected
4. **Safety**: Prevents accidental data loss

## Future Enhancements

Potential future improvements could include:

1. **Cascade Deletion Option**: Allow deletion of plans with automatic enrollment cleanup
2. **Enrollment Transfer**: Option to transfer enrollments to another plan during deletion
3. **Bulk Enrollment Management**: Tools to manage multiple enrollments at once
