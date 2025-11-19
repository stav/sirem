
\restrict 8v9QalV4kLlVP34gJvqzeLf2VKoggfu5JkS7YlSW7vsgXIQlCSE25PXzr7qhIcG


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
BEGIN
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."actions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('America/New_York'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('America/New_York'::"text", "now"()) NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "tags" "text",
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "completed_date" timestamp with time zone,
    "status" "text",
    "priority" "text",
    "duration" numeric(4,2),
    "outcome" "text",
    "source" "text" DEFAULT 'Manual'::"text",
    "metadata" "jsonb"
);


ALTER TABLE "public"."actions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('America/New_York'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('America/New_York'::"text", "now"()) NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "activity_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "activity_date" timestamp with time zone NOT NULL,
    "duration_minutes" integer,
    "outcome" "text",
    "metadata" "jsonb"
);


ALTER TABLE "public"."activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."addresses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('America/New_York'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('America/New_York'::"text", "now"()) NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "address1" "text",
    "address2" "text",
    "city" "text",
    "state_code" "text",
    "postal_code" "text",
    "county" "text",
    "county_fips" "text",
    "latitude" numeric(10,8),
    "longitude" numeric(11,8),
    "address_type" "text",
    "source" "text"
);


ALTER TABLE "public"."addresses" OWNER TO "postgres";


COMMENT ON COLUMN "public"."addresses"."address_type" IS 'Type of address: primary, mailing, billing, shipping, work, home';



COMMENT ON COLUMN "public"."addresses"."source" IS 'Source of address data (e.g., Manual, TPS, Integrity, Google, etc.)';



CREATE TABLE IF NOT EXISTS "public"."contact_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "role_type" "text" NOT NULL,
    "role_data" "jsonb" DEFAULT '{}'::"jsonb",
    "is_primary" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('America/New_York'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('America/New_York'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."contact_roles" OWNER TO "postgres";


COMMENT ON TABLE "public"."contact_roles" IS 'Stores multiple roles for contacts (Medicare client, referral partner, etc.) with role-specific data in JSONB';



COMMENT ON COLUMN "public"."contact_roles"."role_type" IS 'Type of role: medicare_client, referral_partner, tire_shop, dentist, etc.';



COMMENT ON COLUMN "public"."contact_roles"."role_data" IS 'Role-specific data stored as JSONB for flexibility';



COMMENT ON COLUMN "public"."contact_roles"."is_primary" IS 'Whether this is the primary role for the contact';



CREATE TABLE IF NOT EXISTS "public"."contact_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('America/New_York'::"text", "now"()) NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL,
    "metadata" "jsonb",
    "interaction_url" "text",
    "interaction_url_label" "text"
);


ALTER TABLE "public"."contact_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('America/New_York'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('America/New_York'::"text", "now"()) NOT NULL,
    "prefix" "text",
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "middle_name" "text",
    "suffix" "text",
    "phone" "text",
    "email" "text",
    "medicare_beneficiary_id" "text",
    "part_a_status" "text",
    "part_b_status" "text",
    "height" "text",
    "weight" "text",
    "gender" "text",
    "marital_status" "text",
    "has_medicaid" boolean,
    "is_tobacco_user" boolean,
    "birthdate" "date",
    "primary_communication" "text" DEFAULT 'phone'::"text",
    "lead_source" "text" DEFAULT 'Manual'::"text",
    "contact_record_type" "text" DEFAULT 'Prospect'::"text",
    "inactive" boolean DEFAULT false,
    "notes" "text",
    "life_policy_count" integer DEFAULT 0,
    "health_policy_count" integer DEFAULT 0,
    "subsidy_level" "text",
    "lead_status_id" "uuid",
    "status" "text",
    "ssn" "text"
);


ALTER TABLE "public"."contacts" OWNER TO "postgres";


COMMENT ON COLUMN "public"."contacts"."ssn" IS 'Social Security Number (stored as text to preserve formatting)';



CREATE TABLE IF NOT EXISTS "public"."emails" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('America/New_York'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('America/New_York'::"text", "now"()) NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "email_address" "text" NOT NULL,
    "email_label" "text",
    "inactive" boolean DEFAULT false
);


ALTER TABLE "public"."emails" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."enrollments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('America/New_York'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('America/New_York'::"text", "now"()) NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "plan_id" "uuid" NOT NULL,
    "enrollment_status" "text",
    "application_id" "text",
    "signed_up_at" timestamp with time zone,
    "coverage_effective_date" timestamp with time zone,
    "coverage_end_date" timestamp with time zone,
    "premium_monthly_at_enrollment" numeric(10,2),
    "pcp_name" "text",
    "pcp_id" "text",
    "agent_notes" "text",
    "disenrollment_reason" "text",
    "metadata" "jsonb"
);


ALTER TABLE "public"."enrollments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lead_statuses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('America/New_York'::"text", "now"()) NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "color" "text" DEFAULT '#6B7280'::"text"
);


ALTER TABLE "public"."lead_statuses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."phones" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('America/New_York'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('America/New_York'::"text", "now"()) NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "phone_number" "text" NOT NULL,
    "phone_label" "text",
    "inactive" boolean DEFAULT false,
    "is_sms_compatible" boolean DEFAULT false
);


ALTER TABLE "public"."phones" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('America/New_York'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('America/New_York'::"text", "now"()) NOT NULL,
    "name" "text" NOT NULL,
    "carrier" "text",
    "plan_year" integer,
    "cms_contract_number" "text",
    "cms_plan_number" "text",
    "counties" "text"[],
    "metadata" "jsonb",
    "cms_geo_segment" "text",
    "type_network" "text",
    "type_extension" "text",
    "type_snp" "text",
    "type_program" "text"
);


ALTER TABLE "public"."plans" OWNER TO "postgres";


COMMENT ON TABLE "public"."plans" IS 'Plans table with normalized plan type structure (type_network, type_extension, type_snp, type_program) - legacy plan_type field removed in migration 20';



COMMENT ON COLUMN "public"."plans"."cms_geo_segment" IS 'Three-digit county identifier (e.g., "001") used in CMS ID construction';



COMMENT ON COLUMN "public"."plans"."type_network" IS 'Plan network type (HMO, PPO, PFFS, MSA) - values defined in src/lib/plan-constants.ts';



COMMENT ON COLUMN "public"."plans"."type_extension" IS 'Plan extension type (POS or null) - values defined in src/lib/plan-constants.ts';



COMMENT ON COLUMN "public"."plans"."type_snp" IS 'SNP type (D, C, I or null) - values defined in src/lib/plan-constants.ts';



COMMENT ON COLUMN "public"."plans"."type_program" IS 'Program type (SNP, MA, MAPD, PDP, Supplement, Ancillary) - values defined in src/lib/plan-constants.ts';



CREATE TABLE IF NOT EXISTS "public"."reminders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('America/New_York'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('America/New_York'::"text", "now"()) NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "reminder_date" timestamp with time zone NOT NULL,
    "reminder_source" "text" DEFAULT 'Manual'::"text",
    "reminder_type" "text",
    "is_complete" boolean DEFAULT false NOT NULL,
    "completed_date" timestamp with time zone,
    "priority" "text" DEFAULT 'medium'::"text" NOT NULL,
    CONSTRAINT "reminders_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"])))
);


ALTER TABLE "public"."reminders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tag_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('America/New_York'::"text", "now"()) NOT NULL,
    "name" "text" NOT NULL,
    "color" "text" DEFAULT '#A9A9A9'::"text",
    "is_active" boolean DEFAULT true NOT NULL,
    "parent_category_id" "uuid"
);


ALTER TABLE "public"."tag_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('America/New_York'::"text", "now"()) NOT NULL,
    "label" "text" NOT NULL,
    "category_id" "uuid" NOT NULL,
    "icon_url" "text",
    "metadata" "jsonb",
    "is_active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."tags" OWNER TO "postgres";


ALTER TABLE ONLY "public"."actions"
    ADD CONSTRAINT "actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."addresses"
    ADD CONSTRAINT "addresses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_roles"
    ADD CONSTRAINT "contact_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_tags"
    ADD CONSTRAINT "contact_tags_contact_id_tag_id_key" UNIQUE ("contact_id", "tag_id");



ALTER TABLE ONLY "public"."contact_tags"
    ADD CONSTRAINT "contact_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."emails"
    ADD CONSTRAINT "emails_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_statuses"
    ADD CONSTRAINT "lead_statuses_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."lead_statuses"
    ADD CONSTRAINT "lead_statuses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."phones"
    ADD CONSTRAINT "phones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_unique_cms_complete" UNIQUE ("plan_year", "cms_contract_number", "cms_plan_number", "cms_geo_segment");



ALTER TABLE ONLY "public"."reminders"
    ADD CONSTRAINT "reminders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tag_categories"
    ADD CONSTRAINT "tag_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."tag_categories"
    ADD CONSTRAINT "tag_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_actions_completed_date" ON "public"."actions" USING "btree" ("completed_date");



CREATE INDEX "idx_actions_contact_id" ON "public"."actions" USING "btree" ("contact_id");



CREATE INDEX "idx_actions_start_date" ON "public"."actions" USING "btree" ("start_date");



CREATE INDEX "idx_actions_status" ON "public"."actions" USING "btree" ("status");



CREATE INDEX "idx_actions_tags" ON "public"."actions" USING "gin" ("to_tsvector"('"english"'::"regconfig", "tags"));



CREATE INDEX "idx_activities_contact_id" ON "public"."activities" USING "btree" ("contact_id");



CREATE INDEX "idx_activities_date" ON "public"."activities" USING "btree" ("activity_date");



CREATE INDEX "idx_addresses_contact_address1" ON "public"."addresses" USING "btree" ("contact_id", "address1");



CREATE INDEX "idx_addresses_contact_city" ON "public"."addresses" USING "btree" ("contact_id", "city");



CREATE INDEX "idx_addresses_contact_id" ON "public"."addresses" USING "btree" ("contact_id");



CREATE INDEX "idx_addresses_contact_type" ON "public"."addresses" USING "btree" ("contact_id", "address_type");



CREATE INDEX "idx_addresses_dashboard" ON "public"."addresses" USING "btree" ("contact_id", "address1", "city") WHERE (("address1" IS NOT NULL) AND ("city" IS NOT NULL));



CREATE INDEX "idx_addresses_source" ON "public"."addresses" USING "btree" ("source");



CREATE INDEX "idx_addresses_type" ON "public"."addresses" USING "btree" ("address_type");



CREATE INDEX "idx_addresses_validation" ON "public"."addresses" USING "btree" ("contact_id", "address1", "city", "state_code", "postal_code");



CREATE INDEX "idx_contact_roles_active" ON "public"."contact_roles" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_contact_roles_contact_id" ON "public"."contact_roles" USING "btree" ("contact_id");



CREATE INDEX "idx_contact_roles_role_data_gin" ON "public"."contact_roles" USING "gin" ("role_data");



CREATE INDEX "idx_contact_roles_role_type" ON "public"."contact_roles" USING "btree" ("role_type");



CREATE INDEX "idx_contact_tags_contact_id" ON "public"."contact_tags" USING "btree" ("contact_id");



CREATE INDEX "idx_contact_tags_tag_id" ON "public"."contact_tags" USING "btree" ("tag_id");



CREATE INDEX "idx_contacts_created_at" ON "public"."contacts" USING "btree" ("created_at");



CREATE INDEX "idx_contacts_inactive" ON "public"."contacts" USING "btree" ("inactive");



CREATE INDEX "idx_contacts_lead_status" ON "public"."contacts" USING "btree" ("lead_status_id");



CREATE INDEX "idx_contacts_status" ON "public"."contacts" USING "btree" ("status");



CREATE INDEX "idx_emails_contact_id" ON "public"."emails" USING "btree" ("contact_id");



CREATE INDEX "idx_enrollments_contact_id" ON "public"."enrollments" USING "btree" ("contact_id");



CREATE INDEX "idx_enrollments_effective" ON "public"."enrollments" USING "btree" ("coverage_effective_date");



CREATE INDEX "idx_enrollments_plan_id" ON "public"."enrollments" USING "btree" ("plan_id");



CREATE INDEX "idx_enrollments_status" ON "public"."enrollments" USING "btree" ("enrollment_status");



CREATE INDEX "idx_phones_contact_id" ON "public"."phones" USING "btree" ("contact_id");



CREATE INDEX "idx_plans_carrier" ON "public"."plans" USING "btree" ("carrier");



CREATE INDEX "idx_plans_cms_lookup" ON "public"."plans" USING "btree" ("plan_year", "cms_contract_number", "cms_plan_number", "cms_geo_segment");



CREATE INDEX "idx_plans_plan_year" ON "public"."plans" USING "btree" ("plan_year");



CREATE INDEX "idx_plans_type_composite" ON "public"."plans" USING "btree" ("type_network", "type_extension", "type_snp", "type_program");



CREATE INDEX "idx_plans_type_extension" ON "public"."plans" USING "btree" ("type_extension");



CREATE INDEX "idx_plans_type_network" ON "public"."plans" USING "btree" ("type_network");



CREATE INDEX "idx_plans_type_program" ON "public"."plans" USING "btree" ("type_program");



CREATE INDEX "idx_plans_type_snp" ON "public"."plans" USING "btree" ("type_snp");



CREATE INDEX "idx_reminders_complete" ON "public"."reminders" USING "btree" ("is_complete");



CREATE INDEX "idx_reminders_contact_id" ON "public"."reminders" USING "btree" ("contact_id");



CREATE INDEX "idx_reminders_date" ON "public"."reminders" USING "btree" ("reminder_date");



CREATE OR REPLACE TRIGGER "trigger_update_actions_updated_at" BEFORE UPDATE ON "public"."actions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_update_activities_updated_at" BEFORE UPDATE ON "public"."activities" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_update_addresses_updated_at" BEFORE UPDATE ON "public"."addresses" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_update_contacts_updated_at" BEFORE UPDATE ON "public"."contacts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_update_emails_updated_at" BEFORE UPDATE ON "public"."emails" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_update_enrollments_updated_at" BEFORE UPDATE ON "public"."enrollments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_update_phones_updated_at" BEFORE UPDATE ON "public"."phones" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_update_plans_updated_at" BEFORE UPDATE ON "public"."plans" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_update_reminders_updated_at" BEFORE UPDATE ON "public"."reminders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."actions"
    ADD CONSTRAINT "actions_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."addresses"
    ADD CONSTRAINT "addresses_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_roles"
    ADD CONSTRAINT "contact_roles_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_tags"
    ADD CONSTRAINT "contact_tags_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_tags"
    ADD CONSTRAINT "contact_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_lead_status_id_fkey" FOREIGN KEY ("lead_status_id") REFERENCES "public"."lead_statuses"("id");



ALTER TABLE ONLY "public"."emails"
    ADD CONSTRAINT "emails_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."phones"
    ADD CONSTRAINT "phones_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reminders"
    ADD CONSTRAINT "reminders_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tag_categories"
    ADD CONSTRAINT "tag_categories_parent_category_id_fkey" FOREIGN KEY ("parent_category_id") REFERENCES "public"."tag_categories"("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."tag_categories"("id");



CREATE POLICY "Allow public delete access to actions" ON "public"."actions" FOR DELETE USING (true);



CREATE POLICY "Allow public delete access to activities" ON "public"."activities" FOR DELETE USING (true);



CREATE POLICY "Allow public delete access to addresses" ON "public"."addresses" FOR DELETE USING (true);



CREATE POLICY "Allow public delete access to contact_roles" ON "public"."contact_roles" FOR DELETE USING (true);



CREATE POLICY "Allow public delete access to contact_tags" ON "public"."contact_tags" FOR DELETE USING (true);



CREATE POLICY "Allow public delete access to contacts" ON "public"."contacts" FOR DELETE USING (true);



CREATE POLICY "Allow public delete access to emails" ON "public"."emails" FOR DELETE USING (true);



CREATE POLICY "Allow public delete access to enrollments" ON "public"."enrollments" FOR DELETE USING (true);



CREATE POLICY "Allow public delete access to lead_statuses" ON "public"."lead_statuses" FOR DELETE USING (true);



CREATE POLICY "Allow public delete access to phones" ON "public"."phones" FOR DELETE USING (true);



CREATE POLICY "Allow public delete access to plans" ON "public"."plans" FOR DELETE USING (true);



CREATE POLICY "Allow public delete access to reminders" ON "public"."reminders" FOR DELETE USING (true);



CREATE POLICY "Allow public delete access to tag_categories" ON "public"."tag_categories" FOR DELETE USING (true);



CREATE POLICY "Allow public delete access to tags" ON "public"."tags" FOR DELETE USING (true);



CREATE POLICY "Allow public insert access to actions" ON "public"."actions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert access to activities" ON "public"."activities" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert access to addresses" ON "public"."addresses" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert access to contact_roles" ON "public"."contact_roles" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert access to contact_tags" ON "public"."contact_tags" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert access to contacts" ON "public"."contacts" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert access to emails" ON "public"."emails" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert access to enrollments" ON "public"."enrollments" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert access to lead_statuses" ON "public"."lead_statuses" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert access to phones" ON "public"."phones" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert access to plans" ON "public"."plans" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert access to reminders" ON "public"."reminders" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert access to tag_categories" ON "public"."tag_categories" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert access to tags" ON "public"."tags" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public read access to actions" ON "public"."actions" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to activities" ON "public"."activities" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to addresses" ON "public"."addresses" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to contact_roles" ON "public"."contact_roles" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to contact_tags" ON "public"."contact_tags" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to contacts" ON "public"."contacts" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to emails" ON "public"."emails" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to enrollments" ON "public"."enrollments" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to lead_statuses" ON "public"."lead_statuses" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to phones" ON "public"."phones" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to plans" ON "public"."plans" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to reminders" ON "public"."reminders" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to tag_categories" ON "public"."tag_categories" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to tags" ON "public"."tags" FOR SELECT USING (true);



CREATE POLICY "Allow public update access to actions" ON "public"."actions" FOR UPDATE USING (true);



CREATE POLICY "Allow public update access to activities" ON "public"."activities" FOR UPDATE USING (true);



CREATE POLICY "Allow public update access to addresses" ON "public"."addresses" FOR UPDATE USING (true);



CREATE POLICY "Allow public update access to contact_roles" ON "public"."contact_roles" FOR UPDATE USING (true);



CREATE POLICY "Allow public update access to contact_tags" ON "public"."contact_tags" FOR UPDATE USING (true);



CREATE POLICY "Allow public update access to contacts" ON "public"."contacts" FOR UPDATE USING (true);



CREATE POLICY "Allow public update access to emails" ON "public"."emails" FOR UPDATE USING (true);



CREATE POLICY "Allow public update access to enrollments" ON "public"."enrollments" FOR UPDATE USING (true);



CREATE POLICY "Allow public update access to lead_statuses" ON "public"."lead_statuses" FOR UPDATE USING (true);



CREATE POLICY "Allow public update access to phones" ON "public"."phones" FOR UPDATE USING (true);



CREATE POLICY "Allow public update access to plans" ON "public"."plans" FOR UPDATE USING (true);



CREATE POLICY "Allow public update access to reminders" ON "public"."reminders" FOR UPDATE USING (true);



CREATE POLICY "Allow public update access to tag_categories" ON "public"."tag_categories" FOR UPDATE USING (true);



CREATE POLICY "Allow public update access to tags" ON "public"."tags" FOR UPDATE USING (true);



ALTER TABLE "public"."actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."addresses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."emails" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."enrollments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lead_statuses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."phones" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reminders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tag_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";















GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."actions" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."actions" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."actions" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."activities" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."activities" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."activities" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."addresses" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."addresses" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."addresses" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."contact_roles" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."contact_roles" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."contact_roles" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."contact_tags" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."contact_tags" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."contact_tags" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."contacts" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."contacts" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."contacts" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."emails" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."emails" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."emails" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."enrollments" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."enrollments" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."enrollments" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."lead_statuses" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."lead_statuses" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."lead_statuses" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."phones" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."phones" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."phones" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."plans" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."plans" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."plans" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."reminders" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."reminders" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."reminders" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."tag_categories" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."tag_categories" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."tag_categories" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."tags" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."tags" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."tags" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "service_role";






























\unrestrict 8v9QalV4kLlVP34gJvqzeLf2VKoggfu5JkS7YlSW7vsgXIQlCSE25PXzr7qhIcG


RESET ALL;
