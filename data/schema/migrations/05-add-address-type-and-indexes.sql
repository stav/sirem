-- Migration: Add address_type field and performance indexes
-- Date: 2024-01-XX

-- Add address_type field to addresses table
ALTER TABLE public.addresses 
ADD COLUMN address_type text;

-- -- Add constraint for address_type values
-- ALTER TABLE public.addresses 
-- ADD CONSTRAINT addresses_address_type_check 
-- CHECK (address_type IN ('primary', 'mailing', 'billing', 'shipping', 'work', 'home', 'other'));

-- Add performance indexes for address queries
CREATE INDEX idx_addresses_contact_city ON public.addresses(contact_id, city);
CREATE INDEX idx_addresses_contact_address1 ON public.addresses(contact_id, address1);
CREATE INDEX idx_addresses_type ON public.addresses(address_type);
CREATE INDEX idx_addresses_contact_type ON public.addresses(contact_id, address_type);

-- Add composite index for dashboard queries (contact_id + address1 + city)
CREATE INDEX idx_addresses_dashboard ON public.addresses(contact_id, address1, city) 
WHERE address1 IS NOT NULL AND city IS NOT NULL;

-- Add index for address validation queries
CREATE INDEX idx_addresses_validation ON public.addresses(contact_id, address1, city, state_code, postal_code);

-- Add comment to document the address_type field
COMMENT ON COLUMN public.addresses.address_type IS 'Type of address: primary, mailing, billing, shipping, work, home'; 
