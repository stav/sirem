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


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: actions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.actions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
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
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
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
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    contact_id uuid NOT NULL,
    address1 text,
    address2 text,
    city text,
    state_code text,
    postal_code text,
    county text,
    county_fips text,
    latitude numeric(10,8),
    longitude numeric(11,8)
);


--
-- Name: contact_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
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
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    prefix text,
    first_name text NOT NULL,
    last_name text NOT NULL,
    middle_name text,
    suffix text,
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
    phone text,
    email text,
    status text
);


--
-- Name: emails; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.emails (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    contact_id uuid NOT NULL,
    email_address text NOT NULL,
    email_label text,
    inactive boolean DEFAULT false
);


--
-- Name: lead_statuses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_statuses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    name text NOT NULL,
    description text,
    color text DEFAULT '#6B7280'::text
);


--
-- Name: phones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.phones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    contact_id uuid NOT NULL,
    phone_number text NOT NULL,
    phone_label text,
    inactive boolean DEFAULT false,
    is_sms_compatible boolean DEFAULT false
);


--
-- Name: reminders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reminders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
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
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
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
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
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
-- Name: idx_addresses_contact_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_addresses_contact_id ON public.addresses USING btree (contact_id);


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
-- Name: idx_phones_contact_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_phones_contact_id ON public.phones USING btree (contact_id);


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
-- Name: lead_statuses Allow public delete access to lead_statuses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete access to lead_statuses" ON public.lead_statuses FOR DELETE USING (true);


--
-- Name: phones Allow public delete access to phones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete access to phones" ON public.phones FOR DELETE USING (true);


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
-- Name: lead_statuses Allow public insert access to lead_statuses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert access to lead_statuses" ON public.lead_statuses FOR INSERT WITH CHECK (true);


--
-- Name: phones Allow public insert access to phones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert access to phones" ON public.phones FOR INSERT WITH CHECK (true);


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
-- Name: lead_statuses Allow public read access to lead_statuses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access to lead_statuses" ON public.lead_statuses FOR SELECT USING (true);


--
-- Name: phones Allow public read access to phones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access to phones" ON public.phones FOR SELECT USING (true);


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
-- Name: lead_statuses Allow public update access to lead_statuses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update access to lead_statuses" ON public.lead_statuses FOR UPDATE USING (true);


--
-- Name: phones Allow public update access to phones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update access to phones" ON public.phones FOR UPDATE USING (true);


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
-- Name: lead_statuses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lead_statuses ENABLE ROW LEVEL SECURITY;

--
-- Name: phones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.phones ENABLE ROW LEVEL SECURITY;

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

