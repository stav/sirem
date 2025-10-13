--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: carrier; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.carrier AS ENUM (
    'United',
    'Humana',
    'Devoted',
    'Anthem',
    'MedMutual',
    'Aetna',
    'GTL',
    'Medico',
    'CareSource',
    'SummaCare',
    'Cigna',
    'Heartland',
    'Other'
);


--
-- Name: enrollment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enrollment_status AS ENUM (
    'pending',
    'active',
    'cancelled',
    'terminated',
    'declined'
);


--
-- Name: plan_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.plan_type AS ENUM (
    'HMO',
    'HMO-POS',
    'HMO-POS-D-SNP',
    'HMO-POS-C-SNP',
    'PPO',
    'D-SNP',
    'C-SNP',
    'PDP',
    'Supplement',
    'Ancillary'
);


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions'
    AS $$
BEGIN
  NEW.updated_at := timezone('America/New_York'::text, now());
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: actions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.actions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('America/New_York'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('America/New_York'::text, now()) NOT NULL,
    contact_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    tags text,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    completed_date timestamp with time zone,
    status text,
    priority text,
    duration numeric(4,2),
    outcome text,
    source text DEFAULT 'Manual'::text,
    metadata jsonb
);


--
-- Name: activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('America/New_York'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('America/New_York'::text, now()) NOT NULL,
    contact_id uuid NOT NULL,
    activity_type text NOT NULL,
    title text NOT NULL,
    description text,
    activity_date timestamp with time zone NOT NULL,
    duration_minutes integer,
    outcome text,
    metadata jsonb
);


--
-- Name: addresses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.addresses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('America/New_York'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('America/New_York'::text, now()) NOT NULL,
    contact_id uuid NOT NULL,
    address1 text,
    address2 text,
    city text,
    state_code text,
    postal_code text,
    county text,
    county_fips text,
    latitude numeric(10,8),
    longitude numeric(11,8),
    address_type text,
    source text
);


--
-- Name: COLUMN addresses.address_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.addresses.address_type IS 'Type of address: primary, mailing, billing, shipping, work, home';


--
-- Name: COLUMN addresses.source; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.addresses.source IS 'Source of address data (e.g., Manual, TPS, Integrity, Google, etc.)';


--
-- Name: contact_roles; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: TABLE contact_roles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.contact_roles IS 'Stores multiple roles for contacts (Medicare client, referral partner, etc.) with role-specific data in JSONB';


--
-- Name: COLUMN contact_roles.role_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contact_roles.role_type IS 'Type of role: medicare_client, referral_partner, tire_shop, dentist, etc.';


--
-- Name: COLUMN contact_roles.role_data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contact_roles.role_data IS 'Role-specific data stored as JSONB for flexibility';


--
-- Name: COLUMN contact_roles.is_primary; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contact_roles.is_primary IS 'Whether this is the primary role for the contact';


--
-- Name: contact_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('America/New_York'::text, now()) NOT NULL,
    contact_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    metadata jsonb,
    interaction_url text,
    interaction_url_label text
);


--
-- Name: contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('America/New_York'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('America/New_York'::text, now()) NOT NULL,
    prefix text,
    first_name text NOT NULL,
    last_name text NOT NULL,
    middle_name text,
    suffix text,
    phone text,
    email text,
    medicare_beneficiary_id text,
    part_a_status text,
    part_b_status text,
    height text,
    weight text,
    gender text,
    marital_status text,
    has_medicaid boolean,
    is_tobacco_user boolean,
    birthdate date,
    primary_communication text DEFAULT 'phone'::text,
    lead_source text DEFAULT 'Manual'::text,
    contact_record_type text DEFAULT 'Prospect'::text,
    inactive boolean DEFAULT false,
    notes text,
    life_policy_count integer DEFAULT 0,
    health_policy_count integer DEFAULT 0,
    subsidy_level text,
    lead_status_id uuid,
    status text,
    ssn text
);


--
-- Name: COLUMN contacts.ssn; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contacts.ssn IS 'Social Security Number (stored as text to preserve formatting)';


--
-- Name: emails; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.emails (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('America/New_York'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('America/New_York'::text, now()) NOT NULL,
    contact_id uuid NOT NULL,
    email_address text NOT NULL,
    email_label text,
    inactive boolean DEFAULT false
);


--
-- Name: enrollments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enrollments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('America/New_York'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('America/New_York'::text, now()) NOT NULL,
    contact_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    enrollment_status public.enrollment_status,
    application_id text,
    signed_up_at timestamp with time zone,
    coverage_effective_date timestamp with time zone,
    coverage_end_date timestamp with time zone,
    premium_monthly_at_enrollment numeric(10,2),
    pcp_name text,
    pcp_id text,
    agent_notes text,
    disenrollment_reason text,
    metadata jsonb
);


--
-- Name: lead_statuses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_statuses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('America/New_York'::text, now()) NOT NULL,
    name text NOT NULL,
    description text,
    color text DEFAULT '#6B7280'::text
);


--
-- Name: phones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.phones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('America/New_York'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('America/New_York'::text, now()) NOT NULL,
    contact_id uuid NOT NULL,
    phone_number text NOT NULL,
    phone_label text,
    inactive boolean DEFAULT false,
    is_sms_compatible boolean DEFAULT false
);


--
-- Name: plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('America/New_York'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('America/New_York'::text, now()) NOT NULL,
    name text NOT NULL,
    plan_type public.plan_type,
    carrier public.carrier,
    plan_year integer,
    cms_contract_number text,
    cms_plan_number text,
    cms_geo_segment text,
    effective_start timestamp with time zone,
    effective_end timestamp with time zone,
    premium_monthly numeric(10,2),
    giveback_monthly numeric(10,2),
    otc_benefit_quarterly numeric(10,2),
    dental_benefit_yearly numeric(10,2),
    hearing_benefit_yearly numeric(10,2),
    vision_benefit_yearly numeric(10,2),
    primary_care_copay numeric(10,2),
    specialist_copay numeric(10,2),
    hospital_inpatient_per_day_copay numeric(10,2),
    hospital_inpatient_days integer,
    moop_annual numeric(10,2),
    ambulance_copay numeric(10,2),
    emergency_room_copay numeric(10,2),
    urgent_care_copay numeric(10,2),
    pharmacy_benefit text,
    service_area text,
    counties text[],
    notes text,
    metadata jsonb
);


--
-- Name: reminders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reminders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('America/New_York'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('America/New_York'::text, now()) NOT NULL,
    contact_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    reminder_date timestamp with time zone NOT NULL,
    reminder_source text DEFAULT 'Manual'::text,
    reminder_type text,
    is_complete boolean DEFAULT false NOT NULL,
    completed_date timestamp with time zone,
    priority text DEFAULT 'medium'::text NOT NULL,
    CONSTRAINT reminders_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])))
);


--
-- Name: tag_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tag_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('America/New_York'::text, now()) NOT NULL,
    name text NOT NULL,
    color text DEFAULT '#A9A9A9'::text,
    is_active boolean DEFAULT true NOT NULL,
    parent_category_id uuid
);


--
-- Name: tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('America/New_York'::text, now()) NOT NULL,
    label text NOT NULL,
    category_id uuid NOT NULL,
    icon_url text,
    metadata jsonb,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: actions actions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.actions
    ADD CONSTRAINT actions_pkey PRIMARY KEY (id);


--
-- Name: activities activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);


--
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- Name: contact_roles contact_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_roles
    ADD CONSTRAINT contact_roles_pkey PRIMARY KEY (id);


--
-- Name: contact_tags contact_tags_contact_id_tag_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_tags
    ADD CONSTRAINT contact_tags_contact_id_tag_id_key UNIQUE (contact_id, tag_id);


--
-- Name: contact_tags contact_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_tags
    ADD CONSTRAINT contact_tags_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: emails emails_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emails
    ADD CONSTRAINT emails_pkey PRIMARY KEY (id);


--
-- Name: enrollments enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);


--
-- Name: lead_statuses lead_statuses_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_statuses
    ADD CONSTRAINT lead_statuses_name_key UNIQUE (name);


--
-- Name: lead_statuses lead_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_statuses
    ADD CONSTRAINT lead_statuses_pkey PRIMARY KEY (id);


--
-- Name: phones phones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phones
    ADD CONSTRAINT phones_pkey PRIMARY KEY (id);


--
-- Name: plans plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_pkey PRIMARY KEY (id);


--
-- Name: reminders reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_pkey PRIMARY KEY (id);


--
-- Name: tag_categories tag_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag_categories
    ADD CONSTRAINT tag_categories_name_key UNIQUE (name);


--
-- Name: tag_categories tag_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag_categories
    ADD CONSTRAINT tag_categories_pkey PRIMARY KEY (id);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: idx_actions_completed_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_actions_completed_date ON public.actions USING btree (completed_date);


--
-- Name: idx_actions_contact_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_actions_contact_id ON public.actions USING btree (contact_id);


--
-- Name: idx_actions_start_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_actions_start_date ON public.actions USING btree (start_date);


--
-- Name: idx_actions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_actions_status ON public.actions USING btree (status);


--
-- Name: idx_actions_tags; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_actions_tags ON public.actions USING gin (to_tsvector('english'::regconfig, tags));


--
-- Name: idx_activities_contact_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activities_contact_id ON public.activities USING btree (contact_id);


--
-- Name: idx_activities_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activities_date ON public.activities USING btree (activity_date);


--
-- Name: idx_addresses_contact_address1; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_addresses_contact_address1 ON public.addresses USING btree (contact_id, address1);


--
-- Name: idx_addresses_contact_city; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_addresses_contact_city ON public.addresses USING btree (contact_id, city);


--
-- Name: idx_addresses_contact_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_addresses_contact_id ON public.addresses USING btree (contact_id);


--
-- Name: idx_addresses_contact_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_addresses_contact_type ON public.addresses USING btree (contact_id, address_type);


--
-- Name: idx_addresses_dashboard; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_addresses_dashboard ON public.addresses USING btree (contact_id, address1, city) WHERE ((address1 IS NOT NULL) AND (city IS NOT NULL));


--
-- Name: idx_addresses_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_addresses_source ON public.addresses USING btree (source);


--
-- Name: idx_addresses_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_addresses_type ON public.addresses USING btree (address_type);


--
-- Name: idx_addresses_validation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_addresses_validation ON public.addresses USING btree (contact_id, address1, city, state_code, postal_code);


--
-- Name: idx_contact_roles_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contact_roles_active ON public.contact_roles USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_contact_roles_contact_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contact_roles_contact_id ON public.contact_roles USING btree (contact_id);


--
-- Name: idx_contact_roles_role_data_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contact_roles_role_data_gin ON public.contact_roles USING gin (role_data);


--
-- Name: idx_contact_roles_role_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contact_roles_role_type ON public.contact_roles USING btree (role_type);


--
-- Name: idx_contact_tags_contact_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contact_tags_contact_id ON public.contact_tags USING btree (contact_id);


--
-- Name: idx_contact_tags_tag_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contact_tags_tag_id ON public.contact_tags USING btree (tag_id);


--
-- Name: idx_contacts_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_created_at ON public.contacts USING btree (created_at);


--
-- Name: idx_contacts_inactive; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_inactive ON public.contacts USING btree (inactive);


--
-- Name: idx_contacts_lead_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_lead_status ON public.contacts USING btree (lead_status_id);


--
-- Name: idx_contacts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_status ON public.contacts USING btree (status);


--
-- Name: idx_emails_contact_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_emails_contact_id ON public.emails USING btree (contact_id);


--
-- Name: idx_enrollments_contact_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enrollments_contact_id ON public.enrollments USING btree (contact_id);


--
-- Name: idx_enrollments_effective; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enrollments_effective ON public.enrollments USING btree (coverage_effective_date);


--
-- Name: idx_enrollments_plan_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enrollments_plan_id ON public.enrollments USING btree (plan_id);


--
-- Name: idx_enrollments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enrollments_status ON public.enrollments USING btree (enrollment_status);


--
-- Name: idx_phones_contact_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_phones_contact_id ON public.phones USING btree (contact_id);


--
-- Name: idx_plans_carrier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_plans_carrier ON public.plans USING btree (carrier);


--
-- Name: idx_plans_cms_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_plans_cms_id ON public.plans USING btree (cms_id);


--
-- Name: idx_plans_cms_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_plans_cms_unique ON public.plans USING btree (plan_year, cms_contract_number, cms_plan_number, cms_geo_segment);


--
-- Name: idx_plans_plan_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_plans_plan_type ON public.plans USING btree (plan_type);


--
-- Name: idx_plans_plan_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_plans_plan_year ON public.plans USING btree (plan_year);


--
-- Name: idx_reminders_complete; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reminders_complete ON public.reminders USING btree (is_complete);


--
-- Name: idx_reminders_contact_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reminders_contact_id ON public.reminders USING btree (contact_id);


--
-- Name: idx_reminders_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reminders_date ON public.reminders USING btree (reminder_date);


--
-- Name: actions trigger_update_actions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_actions_updated_at BEFORE UPDATE ON public.actions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: activities trigger_update_activities_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_activities_updated_at BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: addresses trigger_update_addresses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_addresses_updated_at BEFORE UPDATE ON public.addresses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contacts trigger_update_contacts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: emails trigger_update_emails_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_emails_updated_at BEFORE UPDATE ON public.emails FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: enrollments trigger_update_enrollments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_enrollments_updated_at BEFORE UPDATE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: phones trigger_update_phones_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_phones_updated_at BEFORE UPDATE ON public.phones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: plans trigger_update_plans_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: reminders trigger_update_reminders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_reminders_updated_at BEFORE UPDATE ON public.reminders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: actions actions_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.actions
    ADD CONSTRAINT actions_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: activities activities_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: addresses addresses_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: contact_roles contact_roles_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_roles
    ADD CONSTRAINT contact_roles_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: contact_tags contact_tags_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_tags
    ADD CONSTRAINT contact_tags_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: contact_tags contact_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_tags
    ADD CONSTRAINT contact_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;


--
-- Name: contacts contacts_lead_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_lead_status_id_fkey FOREIGN KEY (lead_status_id) REFERENCES public.lead_statuses(id);


--
-- Name: emails emails_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emails
    ADD CONSTRAINT emails_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: enrollments enrollments_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: enrollments enrollments_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE RESTRICT;


--
-- Name: phones phones_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phones
    ADD CONSTRAINT phones_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: reminders reminders_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: tag_categories tag_categories_parent_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag_categories
    ADD CONSTRAINT tag_categories_parent_category_id_fkey FOREIGN KEY (parent_category_id) REFERENCES public.tag_categories(id);


--
-- Name: tags tags_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.tag_categories(id);


--
-- Name: actions Allow public delete access to actions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete access to actions" ON public.actions FOR DELETE USING (true);


--
-- Name: activities Allow public delete access to activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete access to activities" ON public.activities FOR DELETE USING (true);


--
-- Name: addresses Allow public delete access to addresses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete access to addresses" ON public.addresses FOR DELETE USING (true);


--
-- Name: contact_roles Allow public delete access to contact_roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete access to contact_roles" ON public.contact_roles FOR DELETE USING (true);


--
-- Name: contact_tags Allow public delete access to contact_tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete access to contact_tags" ON public.contact_tags FOR DELETE USING (true);


--
-- Name: contacts Allow public delete access to contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete access to contacts" ON public.contacts FOR DELETE USING (true);


--
-- Name: emails Allow public delete access to emails; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete access to emails" ON public.emails FOR DELETE USING (true);


--
-- Name: enrollments Allow public delete access to enrollments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete access to enrollments" ON public.enrollments FOR DELETE USING (true);


--
-- Name: lead_statuses Allow public delete access to lead_statuses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete access to lead_statuses" ON public.lead_statuses FOR DELETE USING (true);


--
-- Name: phones Allow public delete access to phones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete access to phones" ON public.phones FOR DELETE USING (true);


--
-- Name: plans Allow public delete access to plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete access to plans" ON public.plans FOR DELETE USING (true);


--
-- Name: reminders Allow public delete access to reminders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete access to reminders" ON public.reminders FOR DELETE USING (true);


--
-- Name: tag_categories Allow public delete access to tag_categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete access to tag_categories" ON public.tag_categories FOR DELETE USING (true);


--
-- Name: tags Allow public delete access to tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete access to tags" ON public.tags FOR DELETE USING (true);


--
-- Name: actions Allow public insert access to actions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert access to actions" ON public.actions FOR INSERT WITH CHECK (true);


--
-- Name: activities Allow public insert access to activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert access to activities" ON public.activities FOR INSERT WITH CHECK (true);


--
-- Name: addresses Allow public insert access to addresses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert access to addresses" ON public.addresses FOR INSERT WITH CHECK (true);


--
-- Name: contact_roles Allow public insert access to contact_roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert access to contact_roles" ON public.contact_roles FOR INSERT WITH CHECK (true);


--
-- Name: contact_tags Allow public insert access to contact_tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert access to contact_tags" ON public.contact_tags FOR INSERT WITH CHECK (true);


--
-- Name: contacts Allow public insert access to contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert access to contacts" ON public.contacts FOR INSERT WITH CHECK (true);


--
-- Name: emails Allow public insert access to emails; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert access to emails" ON public.emails FOR INSERT WITH CHECK (true);


--
-- Name: enrollments Allow public insert access to enrollments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert access to enrollments" ON public.enrollments FOR INSERT WITH CHECK (true);


--
-- Name: lead_statuses Allow public insert access to lead_statuses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert access to lead_statuses" ON public.lead_statuses FOR INSERT WITH CHECK (true);


--
-- Name: phones Allow public insert access to phones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert access to phones" ON public.phones FOR INSERT WITH CHECK (true);


--
-- Name: plans Allow public insert access to plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert access to plans" ON public.plans FOR INSERT WITH CHECK (true);


--
-- Name: reminders Allow public insert access to reminders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert access to reminders" ON public.reminders FOR INSERT WITH CHECK (true);


--
-- Name: tag_categories Allow public insert access to tag_categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert access to tag_categories" ON public.tag_categories FOR INSERT WITH CHECK (true);


--
-- Name: tags Allow public insert access to tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert access to tags" ON public.tags FOR INSERT WITH CHECK (true);


--
-- Name: actions Allow public read access to actions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access to actions" ON public.actions FOR SELECT USING (true);


--
-- Name: activities Allow public read access to activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access to activities" ON public.activities FOR SELECT USING (true);


--
-- Name: addresses Allow public read access to addresses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access to addresses" ON public.addresses FOR SELECT USING (true);


--
-- Name: contact_roles Allow public read access to contact_roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access to contact_roles" ON public.contact_roles FOR SELECT USING (true);


--
-- Name: contact_tags Allow public read access to contact_tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access to contact_tags" ON public.contact_tags FOR SELECT USING (true);


--
-- Name: contacts Allow public read access to contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access to contacts" ON public.contacts FOR SELECT USING (true);


--
-- Name: emails Allow public read access to emails; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access to emails" ON public.emails FOR SELECT USING (true);


--
-- Name: enrollments Allow public read access to enrollments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access to enrollments" ON public.enrollments FOR SELECT USING (true);


--
-- Name: lead_statuses Allow public read access to lead_statuses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access to lead_statuses" ON public.lead_statuses FOR SELECT USING (true);


--
-- Name: phones Allow public read access to phones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access to phones" ON public.phones FOR SELECT USING (true);


--
-- Name: plans Allow public read access to plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access to plans" ON public.plans FOR SELECT USING (true);


--
-- Name: reminders Allow public read access to reminders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access to reminders" ON public.reminders FOR SELECT USING (true);


--
-- Name: tag_categories Allow public read access to tag_categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access to tag_categories" ON public.tag_categories FOR SELECT USING (true);


--
-- Name: tags Allow public read access to tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access to tags" ON public.tags FOR SELECT USING (true);


--
-- Name: actions Allow public update access to actions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update access to actions" ON public.actions FOR UPDATE USING (true);


--
-- Name: activities Allow public update access to activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update access to activities" ON public.activities FOR UPDATE USING (true);


--
-- Name: addresses Allow public update access to addresses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update access to addresses" ON public.addresses FOR UPDATE USING (true);


--
-- Name: contact_roles Allow public update access to contact_roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update access to contact_roles" ON public.contact_roles FOR UPDATE USING (true);


--
-- Name: contact_tags Allow public update access to contact_tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update access to contact_tags" ON public.contact_tags FOR UPDATE USING (true);


--
-- Name: contacts Allow public update access to contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update access to contacts" ON public.contacts FOR UPDATE USING (true);


--
-- Name: emails Allow public update access to emails; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update access to emails" ON public.emails FOR UPDATE USING (true);


--
-- Name: enrollments Allow public update access to enrollments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update access to enrollments" ON public.enrollments FOR UPDATE USING (true);


--
-- Name: lead_statuses Allow public update access to lead_statuses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update access to lead_statuses" ON public.lead_statuses FOR UPDATE USING (true);


--
-- Name: phones Allow public update access to phones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update access to phones" ON public.phones FOR UPDATE USING (true);


--
-- Name: plans Allow public update access to plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update access to plans" ON public.plans FOR UPDATE USING (true);


--
-- Name: reminders Allow public update access to reminders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update access to reminders" ON public.reminders FOR UPDATE USING (true);


--
-- Name: tag_categories Allow public update access to tag_categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update access to tag_categories" ON public.tag_categories FOR UPDATE USING (true);


--
-- Name: tags Allow public update access to tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update access to tags" ON public.tags FOR UPDATE USING (true);


--
-- Name: actions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;

--
-- Name: activities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

--
-- Name: addresses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

--
-- Name: contact_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contact_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: contact_tags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;

--
-- Name: contacts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

--
-- Name: emails; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

--
-- Name: enrollments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

--
-- Name: lead_statuses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lead_statuses ENABLE ROW LEVEL SECURITY;

--
-- Name: phones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.phones ENABLE ROW LEVEL SECURITY;

--
-- Name: plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

--
-- Name: reminders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

--
-- Name: tag_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tag_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: tags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

