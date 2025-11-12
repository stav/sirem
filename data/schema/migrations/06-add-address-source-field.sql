-- Migration: Add source field to addresses table
-- Date: 2024-01-XX

-- Add source field to addresses table
ALTER TABLE public.addresses 
ADD COLUMN source text;

-- Add comment to document the source field
COMMENT ON COLUMN public.addresses.source IS 'Source of address data (e.g., Manual, TPS, Integrity, Google, etc.)';

-- Add index for source queries (optional but useful for filtering)
CREATE INDEX idx_addresses_source ON public.addresses(source); 
