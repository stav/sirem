export const CONTACTS_SELECT_QUERY = `
  *,
  addresses (
    id,
    address1,
    address2,
    city,
    state_code,
    postal_code,
    county,
    county_fips,
    latitude,
    longitude,
    contact_id,
    address_type,
    source,
    created_at,
    updated_at
  ),
  contact_tags (
    tags (
      id,
      label,
      tag_categories (
        id,
        name
      )
    )
  ),
  contact_roles (
    id,
    contact_id,
    role_type,
    role_data,
    is_active,
    is_primary,
    created_at,
    updated_at
  )
`

