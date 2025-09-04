-- Fix search_path for update_updated_at_column function
-- This addresses the Supabase linter warning about mutable search_path

-- First, let's check if the function exists and recreate it with proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- If the function was created without triggers, we should also create the triggers
-- for tables that have updated_at columns

-- Create trigger for actions table
DROP TRIGGER IF EXISTS trigger_update_actions_updated_at ON public.actions;
CREATE TRIGGER trigger_update_actions_updated_at
  BEFORE UPDATE ON public.actions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for activities table
DROP TRIGGER IF EXISTS trigger_update_activities_updated_at ON public.activities;
CREATE TRIGGER trigger_update_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for addresses table
DROP TRIGGER IF EXISTS trigger_update_addresses_updated_at ON public.addresses;
CREATE TRIGGER trigger_update_addresses_updated_at
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for contacts table
DROP TRIGGER IF EXISTS trigger_update_contacts_updated_at ON public.contacts;
CREATE TRIGGER trigger_update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for emails table
DROP TRIGGER IF EXISTS trigger_update_emails_updated_at ON public.emails;
CREATE TRIGGER trigger_update_emails_updated_at
  BEFORE UPDATE ON public.emails
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for phones table
DROP TRIGGER IF EXISTS trigger_update_phones_updated_at ON public.phones;
CREATE TRIGGER trigger_update_phones_updated_at
  BEFORE UPDATE ON public.phones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for reminders table
DROP TRIGGER IF EXISTS trigger_update_reminders_updated_at ON public.reminders;
CREATE TRIGGER trigger_update_reminders_updated_at
  BEFORE UPDATE ON public.reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for plans table
DROP TRIGGER IF EXISTS trigger_update_plans_updated_at ON public.plans;
CREATE TRIGGER trigger_update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for enrollments table
DROP TRIGGER IF EXISTS trigger_update_enrollments_updated_at ON public.enrollments;
CREATE TRIGGER trigger_update_enrollments_updated_at
  BEFORE UPDATE ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
