create extension if not exists "pg_net" with schema "public" version '0.14.0';

create type "public"."event_status" as enum ('proposed', 'confirmed', 'cancelled');

create type "public"."hourly_rate_category" as enum ('flat', 'corporate', 'broadcast');

create type "public"."project_type" as enum ('artist', 'corporate', 'broadcast', 'dry_hire');

create sequence "public"."project_number_seq";

create table "public"."crew_folders" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."crew_folders" enable row level security;

create table "public"."crew_member_roles" (
    "id" uuid not null default gen_random_uuid(),
    "crew_member_id" uuid,
    "role_id" uuid,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."crew_member_roles" enable row level security;

create table "public"."crew_members" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "email" text,
    "phone" text,
    "folder_id" uuid,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "auth_id" uuid,
    "avatar_url" text
);


alter table "public"."crew_members" enable row level security;

create table "public"."crew_roles" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "color" text not null default '#000000'::text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."crew_roles" enable row level security;

create table "public"."customers" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "customer_number" text,
    "organization_number" text,
    "email" text,
    "phone_number" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "tripletex_id" bigint
);


alter table "public"."customers" enable row level security;

create table "public"."development_sessions" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "expires_at" timestamp with time zone not null,
    "is_active" boolean default true
);


alter table "public"."development_sessions" enable row level security;

create table "public"."equipment" (
    "id" uuid not null default gen_random_uuid(),
    "code" text,
    "name" text not null,
    "weight" numeric(10,2),
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "rental_price" numeric,
    "stock_calculation" text,
    "stock" numeric,
    "internal_remark" text,
    "folder_id" uuid
);


alter table "public"."equipment" enable row level security;

create table "public"."equipment_folders" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "parent_id" uuid,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."equipment_folders" enable row level security;

create table "public"."equipment_groups" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "sort_order" integer default 0,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."equipment_groups" enable row level security;

create table "public"."equipment_repairs" (
    "id" uuid not null default gen_random_uuid(),
    "equipment_id" uuid,
    "serial_numbers" text[],
    "quantity" integer default 1,
    "description" text not null,
    "can_be_used" boolean default false,
    "start_date" date not null default CURRENT_DATE,
    "end_date" date,
    "status" text default 'open'::text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."equipment_repairs" enable row level security;

create table "public"."equipment_serial_numbers" (
    "id" uuid not null default gen_random_uuid(),
    "equipment_id" uuid,
    "serial_number" text not null,
    "status" text default 'Available'::text,
    "notes" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."equipment_serial_numbers" enable row level security;

create table "public"."event_types" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "color" text not null,
    "needs_crew" boolean default false,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "needs_equipment" boolean default true,
    "equipment_rate_multiplier" numeric default 1.0,
    "allows_discount" boolean default false,
    "rate_type" text default 'daily'::text,
    "crew_rate_multiplier" numeric default 1.0
);


alter table "public"."event_types" enable row level security;

create table "public"."hourly_rate_settings" (
    "id" uuid not null default gen_random_uuid(),
    "category" hourly_rate_category not null,
    "overtime_threshold" integer default 8,
    "overtime_multiplier" numeric default 1.5,
    "double_time_threshold" integer default 12,
    "double_time_multiplier" numeric default 2.0,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."hourly_rate_settings" enable row level security;

create table "public"."project_crew" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid,
    "crew_member_id" uuid,
    "role_id" uuid,
    "notes" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."project_crew" enable row level security;

create table "public"."project_equipment" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid,
    "equipment_id" uuid,
    "quantity" integer default 1,
    "notes" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "group_id" uuid
);


alter table "public"."project_equipment" enable row level security;

create table "public"."project_equipment_groups" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid,
    "name" text not null,
    "sort_order" integer default 0,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "total_price" numeric default 0
);


alter table "public"."project_equipment_groups" enable row level security;

create table "public"."project_event_equipment" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid,
    "event_id" uuid,
    "equipment_id" uuid,
    "quantity" integer default 1,
    "group_id" uuid,
    "notes" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "is_synced" boolean default true
);


alter table "public"."project_event_equipment" enable row level security;

create table "public"."project_event_roles" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid,
    "event_id" uuid,
    "role_id" uuid,
    "crew_member_id" uuid,
    "daily_rate" numeric,
    "hourly_rate" numeric,
    "hours_worked" numeric(10,1),
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "hourly_category" hourly_rate_category default 'flat'::hourly_rate_category,
    "total_cost" numeric
);


alter table "public"."project_event_roles" enable row level security;

create table "public"."project_events" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid,
    "date" date not null,
    "name" text not null,
    "event_type_id" uuid,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "status" text not null default 'proposed'::text,
    "location" text,
    "equipment_price" numeric default 0,
    "total_price" numeric default 0,
    "crew_price" numeric default 0
);


alter table "public"."project_events" enable row level security;

create table "public"."project_roles" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid,
    "role_id" uuid,
    "daily_rate" numeric,
    "hourly_rate" numeric,
    "preferred_id" uuid,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "hourly_category" hourly_rate_category default 'flat'::hourly_rate_category
);


alter table "public"."project_roles" enable row level security;

create table "public"."project_types" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "code" text not null,
    "price_multiplier" numeric default 1.0,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."project_types" enable row level security;

create table "public"."projects" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "project_number" numeric not null default nextval('project_number_seq'::regclass),
    "customer_id" uuid,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "owner_id" uuid,
    "color" text default 'violet'::text,
    "to_be_invoiced" numeric default 0,
    "is_archived" boolean default false,
    "project_type_id" uuid
);


alter table "public"."projects" enable row level security;

create table "public"."revenue_events" (
    "id" uuid not null default gen_random_uuid(),
    "date" date not null,
    "total_price" numeric not null default 0,
    "status" event_status not null default 'proposed'::event_status,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."revenue_events" enable row level security;

create table "public"."sync_operations" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid,
    "event_id" uuid,
    "status" text default 'pending'::text,
    "attempts" integer default 0,
    "error_message" text,
    "created_at" timestamp with time zone default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone default timezone('utc'::text, now())
);


alter table "public"."sync_operations" enable row level security;

create table "public"."temp_equipment" (
    "created" timestamp with time zone,
    "name" text,
    "code" text,
    "internal_remark" text,
    "rental_price" numeric,
    "stock_calculation" text,
    "weight" numeric,
    "stock" numeric,
    "equipment_folder" text,
    "serial_number" text
);


alter table "public"."temp_equipment" enable row level security;

CREATE UNIQUE INDEX crew_folders_name_key ON public.crew_folders USING btree (name);

CREATE UNIQUE INDEX crew_folders_pkey ON public.crew_folders USING btree (id);

CREATE UNIQUE INDEX crew_member_roles_crew_member_id_role_id_key ON public.crew_member_roles USING btree (crew_member_id, role_id);

CREATE UNIQUE INDEX crew_member_roles_pkey ON public.crew_member_roles USING btree (id);

CREATE UNIQUE INDEX crew_members_auth_id_key ON public.crew_members USING btree (auth_id);

CREATE UNIQUE INDEX crew_members_email_key ON public.crew_members USING btree (email);

CREATE UNIQUE INDEX crew_members_pkey ON public.crew_members USING btree (id);

CREATE UNIQUE INDEX crew_roles_pkey ON public.crew_roles USING btree (id);

CREATE UNIQUE INDEX customers_pkey ON public.customers USING btree (id);

CREATE UNIQUE INDEX customers_tripletex_id_key ON public.customers USING btree (tripletex_id);

CREATE UNIQUE INDEX development_sessions_pkey ON public.development_sessions USING btree (id);

CREATE UNIQUE INDEX equipment_folders_pkey ON public.equipment_folders USING btree (id);

CREATE UNIQUE INDEX equipment_groups_pkey ON public.equipment_groups USING btree (id);

CREATE UNIQUE INDEX equipment_pkey ON public.equipment USING btree (id);

CREATE UNIQUE INDEX equipment_repairs_pkey ON public.equipment_repairs USING btree (id);

CREATE UNIQUE INDEX equipment_serial_numbers_pkey ON public.equipment_serial_numbers USING btree (id);

CREATE UNIQUE INDEX event_types_name_key ON public.event_types USING btree (name);

CREATE UNIQUE INDEX event_types_pkey ON public.event_types USING btree (id);

CREATE UNIQUE INDEX hourly_rate_settings_pkey ON public.hourly_rate_settings USING btree (id);

CREATE INDEX idx_equipment_code ON public.equipment USING btree (code);

CREATE INDEX idx_equipment_folder_id ON public.equipment USING btree (folder_id);

CREATE INDEX idx_equipment_serial_numbers_equipment_id ON public.equipment_serial_numbers USING btree (equipment_id);

CREATE INDEX idx_equipment_serial_numbers_serial_number ON public.equipment_serial_numbers USING btree (serial_number);

CREATE INDEX idx_project_event_equipment_sync ON public.project_event_equipment USING btree (event_id, equipment_id, is_synced);

CREATE INDEX idx_projects_is_archived ON public.projects USING btree (is_archived);

CREATE UNIQUE INDEX project_crew_pkey ON public.project_crew USING btree (id);

CREATE UNIQUE INDEX project_crew_project_id_crew_member_id_key ON public.project_crew USING btree (project_id, crew_member_id);

CREATE UNIQUE INDEX project_equipment_groups_pkey ON public.project_equipment_groups USING btree (id);

CREATE UNIQUE INDEX project_equipment_groups_project_id_name_key ON public.project_equipment_groups USING btree (project_id, name);

CREATE UNIQUE INDEX project_equipment_pkey ON public.project_equipment USING btree (id);

CREATE UNIQUE INDEX project_equipment_project_id_equipment_id_group_id_key ON public.project_equipment USING btree (project_id, equipment_id, group_id);

CREATE UNIQUE INDEX project_event_equipment_event_id_equipment_id_key ON public.project_event_equipment USING btree (event_id, equipment_id);

CREATE UNIQUE INDEX project_event_equipment_pkey ON public.project_event_equipment USING btree (id);

CREATE UNIQUE INDEX project_event_roles_pkey ON public.project_event_roles USING btree (id);

CREATE UNIQUE INDEX project_events_pkey ON public.project_events USING btree (id);

CREATE UNIQUE INDEX project_number_unique ON public.projects USING btree (project_number);

CREATE UNIQUE INDEX project_roles_pkey ON public.project_roles USING btree (id);

CREATE UNIQUE INDEX project_types_code_key ON public.project_types USING btree (code);

CREATE UNIQUE INDEX project_types_pkey ON public.project_types USING btree (id);

CREATE UNIQUE INDEX projects_pkey ON public.projects USING btree (id);

CREATE UNIQUE INDEX revenue_events_date_status_key ON public.revenue_events USING btree (date, status);

CREATE UNIQUE INDEX revenue_events_pkey ON public.revenue_events USING btree (id);

CREATE UNIQUE INDEX sync_operations_pkey ON public.sync_operations USING btree (id);

CREATE INDEX sync_operations_project_event_idx ON public.sync_operations USING btree (project_id, event_id);

CREATE UNIQUE INDEX unique_event_role ON public.project_event_roles USING btree (event_id, role_id);

CREATE UNIQUE INDEX unique_project_role ON public.project_roles USING btree (project_id, role_id);

alter table "public"."crew_folders" add constraint "crew_folders_pkey" PRIMARY KEY using index "crew_folders_pkey";

alter table "public"."crew_member_roles" add constraint "crew_member_roles_pkey" PRIMARY KEY using index "crew_member_roles_pkey";

alter table "public"."crew_members" add constraint "crew_members_pkey" PRIMARY KEY using index "crew_members_pkey";

alter table "public"."crew_roles" add constraint "crew_roles_pkey" PRIMARY KEY using index "crew_roles_pkey";

alter table "public"."customers" add constraint "customers_pkey" PRIMARY KEY using index "customers_pkey";

alter table "public"."development_sessions" add constraint "development_sessions_pkey" PRIMARY KEY using index "development_sessions_pkey";

alter table "public"."equipment" add constraint "equipment_pkey" PRIMARY KEY using index "equipment_pkey";

alter table "public"."equipment_folders" add constraint "equipment_folders_pkey" PRIMARY KEY using index "equipment_folders_pkey";

alter table "public"."equipment_groups" add constraint "equipment_groups_pkey" PRIMARY KEY using index "equipment_groups_pkey";

alter table "public"."equipment_repairs" add constraint "equipment_repairs_pkey" PRIMARY KEY using index "equipment_repairs_pkey";

alter table "public"."equipment_serial_numbers" add constraint "equipment_serial_numbers_pkey" PRIMARY KEY using index "equipment_serial_numbers_pkey";

alter table "public"."event_types" add constraint "event_types_pkey" PRIMARY KEY using index "event_types_pkey";

alter table "public"."hourly_rate_settings" add constraint "hourly_rate_settings_pkey" PRIMARY KEY using index "hourly_rate_settings_pkey";

alter table "public"."project_crew" add constraint "project_crew_pkey" PRIMARY KEY using index "project_crew_pkey";

alter table "public"."project_equipment" add constraint "project_equipment_pkey" PRIMARY KEY using index "project_equipment_pkey";

alter table "public"."project_equipment_groups" add constraint "project_equipment_groups_pkey" PRIMARY KEY using index "project_equipment_groups_pkey";

alter table "public"."project_event_equipment" add constraint "project_event_equipment_pkey" PRIMARY KEY using index "project_event_equipment_pkey";

alter table "public"."project_event_roles" add constraint "project_event_roles_pkey" PRIMARY KEY using index "project_event_roles_pkey";

alter table "public"."project_events" add constraint "project_events_pkey" PRIMARY KEY using index "project_events_pkey";

alter table "public"."project_roles" add constraint "project_roles_pkey" PRIMARY KEY using index "project_roles_pkey";

alter table "public"."project_types" add constraint "project_types_pkey" PRIMARY KEY using index "project_types_pkey";

alter table "public"."projects" add constraint "projects_pkey" PRIMARY KEY using index "projects_pkey";

alter table "public"."revenue_events" add constraint "revenue_events_pkey" PRIMARY KEY using index "revenue_events_pkey";

alter table "public"."sync_operations" add constraint "sync_operations_pkey" PRIMARY KEY using index "sync_operations_pkey";

alter table "public"."crew_folders" add constraint "crew_folders_name_key" UNIQUE using index "crew_folders_name_key";

alter table "public"."crew_member_roles" add constraint "crew_member_roles_crew_member_id_role_id_key" UNIQUE using index "crew_member_roles_crew_member_id_role_id_key";

alter table "public"."crew_members" add constraint "crew_members_auth_id_fkey" FOREIGN KEY (auth_id) REFERENCES auth.users(id) not valid;

alter table "public"."crew_members" validate constraint "crew_members_auth_id_fkey";

alter table "public"."crew_members" add constraint "crew_members_auth_id_key" UNIQUE using index "crew_members_auth_id_key";

alter table "public"."crew_members" add constraint "crew_members_email_key" UNIQUE using index "crew_members_email_key";

alter table "public"."crew_members" add constraint "crew_members_folder_id_fkey" FOREIGN KEY (folder_id) REFERENCES crew_folders(id) not valid;

alter table "public"."crew_members" validate constraint "crew_members_folder_id_fkey";

alter table "public"."customers" add constraint "customers_tripletex_id_key" UNIQUE using index "customers_tripletex_id_key";

alter table "public"."equipment" add constraint "equipment_folder_id_fkey" FOREIGN KEY (folder_id) REFERENCES equipment_folders(id) not valid;

alter table "public"."equipment" validate constraint "equipment_folder_id_fkey";

alter table "public"."equipment" add constraint "equipment_stock_calculation_check" CHECK ((stock_calculation = ANY (ARRAY['manual'::text, 'serial_numbers'::text, 'consumable'::text]))) not valid;

alter table "public"."equipment" validate constraint "equipment_stock_calculation_check";

alter table "public"."equipment_folders" add constraint "equipment_folders_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES equipment_folders(id) not valid;

alter table "public"."equipment_folders" validate constraint "equipment_folders_parent_id_fkey";

alter table "public"."equipment_repairs" add constraint "equipment_repairs_equipment_id_fkey" FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE not valid;

alter table "public"."equipment_repairs" validate constraint "equipment_repairs_equipment_id_fkey";

alter table "public"."equipment_serial_numbers" add constraint "equipment_serial_numbers_equipment_id_fkey" FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE not valid;

alter table "public"."equipment_serial_numbers" validate constraint "equipment_serial_numbers_equipment_id_fkey";

alter table "public"."event_types" add constraint "event_types_name_key" UNIQUE using index "event_types_name_key";

alter table "public"."event_types" add constraint "event_types_rate_type_check" CHECK ((rate_type = ANY (ARRAY['hourly'::text, 'daily'::text]))) not valid;

alter table "public"."event_types" validate constraint "event_types_rate_type_check";

alter table "public"."project_crew" add constraint "project_crew_project_id_crew_member_id_key" UNIQUE using index "project_crew_project_id_crew_member_id_key";

alter table "public"."project_crew" add constraint "project_crew_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE not valid;

alter table "public"."project_crew" validate constraint "project_crew_project_id_fkey";

alter table "public"."project_equipment" add constraint "project_equipment_equipment_id_fkey" FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE not valid;

alter table "public"."project_equipment" validate constraint "project_equipment_equipment_id_fkey";

alter table "public"."project_equipment" add constraint "project_equipment_group_id_fkey" FOREIGN KEY (group_id) REFERENCES project_equipment_groups(id) ON DELETE SET NULL not valid;

alter table "public"."project_equipment" validate constraint "project_equipment_group_id_fkey";

alter table "public"."project_equipment" add constraint "project_equipment_project_id_equipment_id_group_id_key" UNIQUE using index "project_equipment_project_id_equipment_id_group_id_key";

alter table "public"."project_equipment" add constraint "project_equipment_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE not valid;

alter table "public"."project_equipment" validate constraint "project_equipment_project_id_fkey";

alter table "public"."project_equipment_groups" add constraint "project_equipment_groups_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE not valid;

alter table "public"."project_equipment_groups" validate constraint "project_equipment_groups_project_id_fkey";

alter table "public"."project_equipment_groups" add constraint "project_equipment_groups_project_id_name_key" UNIQUE using index "project_equipment_groups_project_id_name_key";

alter table "public"."project_event_equipment" add constraint "project_event_equipment_equipment_id_fkey" FOREIGN KEY (equipment_id) REFERENCES equipment(id) not valid;

alter table "public"."project_event_equipment" validate constraint "project_event_equipment_equipment_id_fkey";

alter table "public"."project_event_equipment" add constraint "project_event_equipment_event_id_equipment_id_key" UNIQUE using index "project_event_equipment_event_id_equipment_id_key";

alter table "public"."project_event_equipment" add constraint "project_event_equipment_event_id_fkey" FOREIGN KEY (event_id) REFERENCES project_events(id) not valid;

alter table "public"."project_event_equipment" validate constraint "project_event_equipment_event_id_fkey";

alter table "public"."project_event_equipment" add constraint "project_event_equipment_group_id_fkey" FOREIGN KEY (group_id) REFERENCES project_equipment_groups(id) not valid;

alter table "public"."project_event_equipment" validate constraint "project_event_equipment_group_id_fkey";

alter table "public"."project_event_equipment" add constraint "project_event_equipment_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) not valid;

alter table "public"."project_event_equipment" validate constraint "project_event_equipment_project_id_fkey";

alter table "public"."project_event_roles" add constraint "hours_worked_increment" CHECK (((hours_worked % 0.5) = (0)::numeric)) not valid;

alter table "public"."project_event_roles" validate constraint "hours_worked_increment";

alter table "public"."project_event_roles" add constraint "project_event_roles_crew_member_id_fkey" FOREIGN KEY (crew_member_id) REFERENCES crew_members(id) ON DELETE SET NULL not valid;

alter table "public"."project_event_roles" validate constraint "project_event_roles_crew_member_id_fkey";

alter table "public"."project_event_roles" add constraint "project_event_roles_event_id_fkey" FOREIGN KEY (event_id) REFERENCES project_events(id) ON DELETE CASCADE not valid;

alter table "public"."project_event_roles" validate constraint "project_event_roles_event_id_fkey";

alter table "public"."project_event_roles" add constraint "project_event_roles_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE not valid;

alter table "public"."project_event_roles" validate constraint "project_event_roles_project_id_fkey";

alter table "public"."project_event_roles" add constraint "project_event_roles_role_id_fkey" FOREIGN KEY (role_id) REFERENCES crew_roles(id) not valid;

alter table "public"."project_event_roles" validate constraint "project_event_roles_role_id_fkey";

alter table "public"."project_event_roles" add constraint "unique_event_role" UNIQUE using index "unique_event_role";

alter table "public"."project_events" add constraint "project_events_event_type_id_fkey" FOREIGN KEY (event_type_id) REFERENCES event_types(id) not valid;

alter table "public"."project_events" validate constraint "project_events_event_type_id_fkey";

alter table "public"."project_events" add constraint "project_events_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) not valid;

alter table "public"."project_events" validate constraint "project_events_project_id_fkey";

alter table "public"."project_roles" add constraint "project_roles_preferred_id_fkey" FOREIGN KEY (preferred_id) REFERENCES crew_members(id) ON DELETE SET NULL not valid;

alter table "public"."project_roles" validate constraint "project_roles_preferred_id_fkey";

alter table "public"."project_roles" add constraint "project_roles_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE not valid;

alter table "public"."project_roles" validate constraint "project_roles_project_id_fkey";

alter table "public"."project_roles" add constraint "project_roles_role_id_fkey" FOREIGN KEY (role_id) REFERENCES crew_roles(id) not valid;

alter table "public"."project_roles" validate constraint "project_roles_role_id_fkey";

alter table "public"."project_roles" add constraint "unique_project_role" UNIQUE using index "unique_project_role";

alter table "public"."project_types" add constraint "project_types_code_key" UNIQUE using index "project_types_code_key";

alter table "public"."projects" add constraint "project_number_unique" UNIQUE using index "project_number_unique";

alter table "public"."projects" add constraint "projects_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) not valid;

alter table "public"."projects" validate constraint "projects_customer_id_fkey";

alter table "public"."projects" add constraint "projects_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES crew_members(id) not valid;

alter table "public"."projects" validate constraint "projects_owner_id_fkey";

alter table "public"."projects" add constraint "projects_project_type_id_fkey" FOREIGN KEY (project_type_id) REFERENCES project_types(id) not valid;

alter table "public"."projects" validate constraint "projects_project_type_id_fkey";

alter table "public"."revenue_events" add constraint "revenue_events_date_status_key" UNIQUE using index "revenue_events_date_status_key";

alter table "public"."sync_operations" add constraint "sync_operations_event_id_fkey" FOREIGN KEY (event_id) REFERENCES project_events(id) not valid;

alter table "public"."sync_operations" validate constraint "sync_operations_event_id_fkey";

alter table "public"."sync_operations" add constraint "sync_operations_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) not valid;

alter table "public"."sync_operations" validate constraint "sync_operations_project_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.calculate_hourly_cost(p_hours numeric, p_hourly_rate numeric, p_category hourly_rate_category)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_settings hourly_rate_settings%ROWTYPE;
    v_regular_hours numeric;
    v_overtime_hours numeric;
    v_double_time_hours numeric;
    v_total_cost numeric;
BEGIN
    -- Get settings for the category
    SELECT * INTO v_settings
    FROM hourly_rate_settings
    WHERE category = p_category;

    -- For flat rate, simple multiplication
    IF p_category = 'flat' THEN
        RETURN p_hours * p_hourly_rate;
    END IF;

    -- Calculate hours in each bracket
    v_regular_hours := LEAST(p_hours, v_settings.overtime_threshold);
    
    IF p_category = 'corporate' THEN
        -- Corporate: Only regular and overtime
        v_overtime_hours := GREATEST(p_hours - v_settings.overtime_threshold, 0);
        v_double_time_hours := 0;
    ELSE
        -- Broadcast: Regular, overtime, and double time
        v_overtime_hours := LEAST(
            GREATEST(p_hours - v_settings.overtime_threshold, 0),
            v_settings.double_time_threshold - v_settings.overtime_threshold
        );
        v_double_time_hours := GREATEST(p_hours - v_settings.double_time_threshold, 0);
    END IF;

    -- Calculate total cost
    v_total_cost := (v_regular_hours * p_hourly_rate) +
                    (v_overtime_hours * p_hourly_rate * v_settings.overtime_multiplier) +
                    (v_double_time_hours * p_hourly_rate * v_settings.double_time_multiplier);

    RETURN v_total_cost;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_hourly_cost(p_hours numeric, p_hourly_rate numeric, p_category hourly_rate_category, p_is_artist boolean DEFAULT false, p_is_hours_event boolean DEFAULT false)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_settings hourly_rate_settings%ROWTYPE;
    v_regular_hours numeric;
    v_overtime_hours numeric;
    v_double_time_hours numeric;
    v_total_cost numeric;
BEGIN
    -- For artist projects with hours event type, simple multiplication
    IF p_is_artist AND p_is_hours_event THEN
        RETURN p_hours * p_hourly_rate;
    END IF;

    -- For flat rate or artist projects (non-hours events), simple multiplication
    IF p_category = 'flat' OR p_is_artist THEN
        RETURN p_hours * p_hourly_rate;
    END IF;

    -- Get settings for the category
    SELECT * INTO v_settings
    FROM hourly_rate_settings
    WHERE category = p_category;

    -- Calculate hours in each bracket
    v_regular_hours := LEAST(p_hours, v_settings.overtime_threshold);
    
    IF p_category = 'corporate' THEN
        -- Corporate: Only regular and overtime
        v_overtime_hours := GREATEST(p_hours - v_settings.overtime_threshold, 0);
        v_double_time_hours := 0;
    ELSE
        -- Broadcast: Regular, overtime, and double time
        v_overtime_hours := LEAST(
            GREATEST(p_hours - v_settings.overtime_threshold, 0),
            v_settings.double_time_threshold - v_settings.overtime_threshold
        );
        v_double_time_hours := GREATEST(p_hours - v_settings.double_time_threshold, 0);
    END IF;

    -- Calculate total cost
    v_total_cost := (v_regular_hours * p_hourly_rate) +
                    (v_overtime_hours * p_hourly_rate * v_settings.overtime_multiplier) +
                    (v_double_time_hours * p_hourly_rate * v_settings.double_time_multiplier);

    RETURN v_total_cost;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_equipment_sync()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- For any change in project equipment, mark related event equipment as out of sync
    UPDATE project_event_equipment
    SET is_synced = false
    FROM project_events
    WHERE project_event_equipment.event_id = project_events.id
    AND project_events.project_id = COALESCE(NEW.project_id, OLD.project_id)
    AND project_events.status NOT IN ('cancelled', 'invoice ready')
    AND (
        -- For updates and deletes, mark equipment that was modified
        (TG_OP IN ('UPDATE', 'DELETE') AND project_event_equipment.equipment_id = OLD.equipment_id)
        -- For inserts, mark all event equipment for the project since quantities might need adjusting
        OR (TG_OP = 'INSERT')
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_event_equipment()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Copy all equipment from project_equipment to the new event
    INSERT INTO project_event_equipment (
        project_id,
        event_id,
        equipment_id,
        quantity,
        group_id,
        is_synced
    )
    SELECT 
        NEW.project_id,
        NEW.id,
        equipment_id,
        quantity,
        group_id,
        true
    FROM project_equipment
    WHERE project_id = NEW.project_id
    ON CONFLICT (event_id, equipment_id) DO NOTHING;

    -- Update the event prices immediately after creating equipment
    UPDATE project_events pe
    SET 
        equipment_price = (
            SELECT COALESCE(SUM(pee.quantity * e.rental_price), 0)
            FROM project_event_equipment pee
            JOIN equipment e ON e.id = pee.equipment_id
            WHERE pee.event_id = pe.id
        ),
        total_price = (
            SELECT COALESCE(SUM(pee.quantity * e.rental_price), 0)
            FROM project_event_equipment pee
            JOIN equipment e ON e.id = pee.equipment_id
            WHERE pee.event_id = pe.id
        )
    WHERE pe.id = NEW.id;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    crew_member_id uuid;
    sonic_city_folder_id uuid;
BEGIN
    -- Get the Sonic City folder ID
    SELECT id INTO sonic_city_folder_id
    FROM crew_folders
    WHERE name = 'Sonic City';

    -- Check if there's a matching crew member
    SELECT id INTO crew_member_id
    FROM crew_members
    WHERE email = new.email
    AND folder_id = sonic_city_folder_id
    AND auth_id IS NULL;

    -- If we found a matching crew member, link them and set their avatar
    IF crew_member_id IS NOT NULL THEN
        UPDATE crew_members
        SET 
            auth_id = new.id,
            avatar_url = new.raw_user_meta_data->>'avatar_url'
        WHERE id = crew_member_id;
    ELSE
        -- If no matching crew member, delete the auth user
        -- This ensures only existing crew members can sign up
        DELETE FROM auth.users WHERE id = new.id;
        RAISE EXCEPTION 'User not found in Sonic City crew members';
    END IF;

    RETURN new;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_all_avatars()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE crew_members cm
    SET avatar_url = (
        SELECT raw_user_meta_data->>'avatar_url'
        FROM auth.users au
        WHERE au.id = cm.auth_id
    )
    WHERE cm.auth_id IS NOT NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_equipment_folder_name()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Update equipment table when folder name changes
    UPDATE equipment 
    SET "Folder" = NEW.name
    WHERE folder_id = NEW.id;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_event_equipment()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Only sync for active events (not cancelled or invoice ready)
  UPDATE project_event_equipment pee
  SET quantity = pe.quantity
  FROM project_equipment pe
  JOIN project_events ev ON ev.project_id = pe.project_id
  WHERE pee.event_id = ev.id
  AND pee.equipment_id = pe.equipment_id
  AND ev.status NOT IN ('cancelled', 'invoice ready')
  AND pe.project_id = NEW.project_id;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_user_avatar()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- When auth_id is set or updated, sync the avatar_url from auth.users
    IF NEW.auth_id IS NOT NULL THEN
        UPDATE crew_members
        SET avatar_url = (
            SELECT raw_user_meta_data->>'avatar_url'
            FROM auth.users
            WHERE id = NEW.auth_id
        )
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_equipment_stock()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Update the stock count for the affected equipment
    UPDATE equipment
    SET stock = (
        SELECT COUNT(*)
        FROM equipment_serial_numbers
        WHERE equipment_id = COALESCE(NEW.equipment_id, OLD.equipment_id)
        AND status = 'Available'
    )
    WHERE id = COALESCE(NEW.equipment_id, OLD.equipment_id);
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_event_prices()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Lock the event row to prevent concurrent updates
  PERFORM pg_advisory_xact_lock(hashtext('event_price_update' || COALESCE(NEW.event_id, OLD.event_id)::text));
  
  -- Update the event equipment and crew prices
  UPDATE project_events pe
  SET 
    equipment_price = (
      SELECT COALESCE(SUM(pee.quantity * e.rental_price * et.equipment_rate_multiplier), 0)
      FROM project_event_equipment pee
      JOIN equipment e ON e.id = pee.equipment_id
      JOIN event_types et ON et.id = pe.event_type_id
      WHERE pee.event_id = pe.id
    ),
    crew_price = (
      SELECT COALESCE(SUM(per.total_cost * et.crew_rate_multiplier), 0)
      FROM project_event_roles per
      JOIN event_types et ON et.id = pe.event_type_id
      WHERE per.event_id = pe.id
      AND per.total_cost IS NOT NULL
    ),
    total_price = (
      SELECT 
        COALESCE(equipment_calc.equipment_total, 0) + COALESCE(crew_calc.crew_total, 0)
      FROM (
        SELECT COALESCE(SUM(pee.quantity * e.rental_price * et.equipment_rate_multiplier), 0) as equipment_total
        FROM project_event_equipment pee
        JOIN equipment e ON e.id = pee.equipment_id
        JOIN event_types et ON et.id = pe.event_type_id
        WHERE pee.event_id = pe.id
      ) equipment_calc,
      (
        SELECT COALESCE(SUM(per.total_cost * et.crew_rate_multiplier), 0) as crew_total
        FROM project_event_roles per
        JOIN event_types et ON et.id = pe.event_type_id
        WHERE per.event_id = pe.id
        AND per.total_cost IS NOT NULL
      ) crew_calc
    )
  WHERE pe.id = COALESCE(NEW.event_id, OLD.event_id);

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_event_role_cost()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_is_artist boolean;
    v_is_hours_event boolean;
BEGIN
    -- Get project type and event type information
    SELECT 
        pt.code = 'artist',
        et.name = 'hours'
    INTO 
        v_is_artist,
        v_is_hours_event
    FROM project_event_roles per
    JOIN project_events pe ON pe.id = per.event_id
    JOIN projects p ON p.id = pe.project_id
    LEFT JOIN project_types pt ON pt.id = p.project_type_id
    LEFT JOIN event_types et ON et.id = pe.event_type_id
    WHERE per.id = NEW.id;

    IF NEW.hours_worked IS NOT NULL AND NEW.hourly_rate IS NOT NULL THEN
        -- Calculate the cost based on the category and hours
        NEW.total_cost := calculate_hourly_cost(
            NEW.hours_worked,
            NEW.hourly_rate,
            COALESCE(NEW.hourly_category, 'flat'),
            v_is_artist,
            v_is_hours_event
        );
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_group_prices()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Update the group total price
  UPDATE project_equipment_groups peg
  SET total_price = (
    SELECT COALESCE(SUM(pe.quantity * e.rental_price), 0)
    FROM project_equipment pe
    JOIN equipment e ON e.id = pe.equipment_id
    WHERE pe.group_id = peg.id
  )
  WHERE peg.id = COALESCE(NEW.group_id, OLD.group_id);

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_group_sort_orders(p_project_id uuid, p_source_group_id uuid, p_target_sort_order integer, p_direction integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Update sort orders for groups between source and target
  UPDATE project_equipment_groups
  SET sort_order = sort_order + p_direction
  WHERE project_id = p_project_id
    AND id != p_source_group_id
    AND (
      (p_direction > 0 AND sort_order >= p_target_sort_order)
      OR
      (p_direction < 0 AND sort_order <= p_target_sort_order)
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_project_to_be_invoiced()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Update the project's to_be_invoiced amount
  UPDATE projects p
  SET to_be_invoiced = (
    SELECT COALESCE(SUM(total_price), 0)
    FROM project_events
    WHERE project_id = p.id
    AND status = 'ready'
  )
  WHERE id = NEW.project_id;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_revenue_events()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Only process events with valid status values
    IF NEW.status IN ('proposed', 'confirmed', 'invoice ready', 'invoiced', 'cancelled') THEN
        INSERT INTO revenue_events (date, total_price, status)
        VALUES (
            NEW.date,
            COALESCE(NEW.total_price, 0),
            CASE 
                WHEN NEW.status IN ('invoice ready', 'invoiced') THEN 'confirmed'::event_status
                ELSE NEW.status::event_status
            END
        )
        ON CONFLICT (date, status) 
        DO UPDATE SET
            total_price = revenue_events.total_price + EXCLUDED.total_price;
    END IF;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_event_crew(p_event_id uuid, p_project_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_crew_rate_multiplier DECIMAL;
BEGIN
  -- Get the event's crew rate multiplier
  SELECT et.crew_rate_multiplier INTO v_crew_rate_multiplier
  FROM project_events pe
  JOIN event_types et ON pe.event_type_id = et.id
  WHERE pe.id = p_event_id;
  
  -- Default to 1.0 if no multiplier found
  IF v_crew_rate_multiplier IS NULL THEN
    v_crew_rate_multiplier := 1.0;
  END IF;

  -- Delete existing event crew for this event
  DELETE FROM project_event_roles 
  WHERE event_id = p_event_id;
  
  -- Insert project crew roles with deduplication and conflict resolution
  -- Use DISTINCT ON to ensure only one row per role_id
  INSERT INTO project_event_roles (
    project_id,
    event_id, 
    role_id,
    crew_member_id,
    daily_rate,
    hourly_rate,
    hourly_category,
    total_cost,
    created_at,
    updated_at
  )
  SELECT DISTINCT ON (role_id)
    p_project_id,
    p_event_id,
    role_id,
    preferred_id, -- Use preferred crew member
    daily_rate,
    hourly_rate,
    hourly_category,
    daily_rate, -- Set total_cost to daily_rate initially
    NOW(),
    NOW()
  FROM project_roles 
  WHERE project_id = p_project_id
  ORDER BY role_id, updated_at DESC -- Use most recent entry if duplicates exist
  ON CONFLICT (event_id, role_id) 
  DO UPDATE SET 
    crew_member_id = EXCLUDED.crew_member_id,
    daily_rate = EXCLUDED.daily_rate,
    hourly_rate = EXCLUDED.hourly_rate,
    hourly_category = EXCLUDED.hourly_category,
    total_cost = EXCLUDED.total_cost,
    updated_at = NOW();

  -- NEW: Calculate and update crew_price (following equipment pattern)
  -- This calculates cost from project role requirements (customer-facing)
  UPDATE project_events 
  SET 
    crew_price = COALESCE((
      SELECT SUM(COALESCE(daily_rate, 0) * v_crew_rate_multiplier)
      FROM project_roles 
      WHERE project_id = p_project_id
    ), 0),
    updated_at = NOW()
  WHERE id = p_event_id;
  
  -- Update total_price (equipment_price + crew_price)
  UPDATE project_events 
  SET 
    total_price = COALESCE(equipment_price, 0) + COALESCE(crew_price, 0),
    updated_at = NOW()
  WHERE id = p_event_id;
  
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_event_equipment(p_event_id uuid, p_project_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Just call the unified function
  PERFORM sync_event_equipment_unified(p_event_id, p_project_id);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_event_equipment_unified(p_event_id uuid, p_project_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_event_type_multiplier DECIMAL;
BEGIN
  -- Get the event's equipment rate multiplier
  SELECT et.equipment_rate_multiplier INTO v_event_type_multiplier
  FROM project_events pe
  JOIN event_types et ON pe.event_type_id = et.id
  WHERE pe.id = p_event_id;
  
  -- Default to 1.0 if no multiplier found
  IF v_event_type_multiplier IS NULL THEN
    v_event_type_multiplier := 1.0;
  END IF;
  
  -- Delete ALL existing event equipment for this event (clean slate)
  DELETE FROM project_event_equipment 
  WHERE event_id = p_event_id;
  
  -- Insert project equipment with proper pricing calculation
  INSERT INTO project_event_equipment (
    project_id, 
    event_id, 
    equipment_id, 
    quantity, 
    group_id,
    notes,
    is_synced,
    created_at,
    updated_at
  )
  SELECT DISTINCT ON (pe.equipment_id)
    p_project_id,
    p_event_id,
    pe.equipment_id,
    pe.quantity,
    pe.group_id,
    pe.notes,
    true, -- is_synced
    NOW(),
    NOW()
  FROM project_equipment pe
  WHERE pe.project_id = p_project_id
  ORDER BY pe.equipment_id, pe.updated_at DESC; -- Use most recent if duplicates
  
  -- Update the event's equipment_price with calculated total
  -- This uses the equipment rental_price * quantity * event_type_multiplier
  UPDATE project_events 
  SET 
    equipment_price = COALESCE((
      SELECT SUM(
        COALESCE(e.rental_price, 0) * 
        COALESCE(pee.quantity, 0) * 
        v_event_type_multiplier
      )
      FROM project_event_equipment pee
      JOIN equipment e ON pee.equipment_id = e.id
      WHERE pee.event_id = p_event_id
    ), 0),
    updated_at = NOW()
  WHERE id = p_event_id;
  
  -- Update total_price (equipment_price + crew_price)
  UPDATE project_events 
  SET 
    total_price = COALESCE(equipment_price, 0) + COALESCE(crew_price, 0),
    updated_at = NOW()
  WHERE id = p_event_id;
  
END;
$function$
;

create policy "Enable all operations for all users"
on "public"."crew_folders"
as permissive
for all
to public
using (true)
with check (true);


create policy "Enable delete for authenticated users"
on "public"."crew_folders"
as permissive
for delete
to authenticated
using (true);


create policy "Enable insert for authenticated users"
on "public"."crew_folders"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable read access for all users"
on "public"."crew_folders"
as permissive
for select
to public
using (true);


create policy "Enable update for authenticated users"
on "public"."crew_folders"
as permissive
for update
to authenticated
using (true);


create policy "Enable all operations for all users"
on "public"."crew_member_roles"
as permissive
for all
to public
using (true)
with check (true);


create policy "Enable delete for authenticated users"
on "public"."crew_member_roles"
as permissive
for delete
to authenticated
using (true);


create policy "Enable insert for authenticated users"
on "public"."crew_member_roles"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable public access to crew_member_roles"
on "public"."crew_member_roles"
as permissive
for all
to public
using (true)
with check (true);


create policy "Enable read access for authenticated users"
on "public"."crew_member_roles"
as permissive
for select
to authenticated
using (true);


create policy "Enable update for authenticated users"
on "public"."crew_member_roles"
as permissive
for update
to authenticated
using (true);


create policy "Enable all operations for all users"
on "public"."crew_members"
as permissive
for all
to public
using (true)
with check (true);


create policy "Enable complete access for authenticated users"
on "public"."crew_members"
as permissive
for all
to authenticated
using (true)
with check (true);


create policy "Enable delete for authenticated users"
on "public"."crew_members"
as permissive
for delete
to authenticated
using (true);


create policy "Enable insert for authenticated users"
on "public"."crew_members"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable public access to crew_members"
on "public"."crew_members"
as permissive
for all
to public
using (true)
with check (true);


create policy "Enable read access for authenticated users"
on "public"."crew_members"
as permissive
for select
to authenticated
using (true);


create policy "Enable update for authenticated users"
on "public"."crew_members"
as permissive
for update
to authenticated
using (true);


create policy "Users can view their own crew member data"
on "public"."crew_members"
as permissive
for select
to authenticated
using ((auth_id = auth.uid()));


create policy "Enable all operations for all users"
on "public"."crew_roles"
as permissive
for all
to public
using (true)
with check (true);


create policy "Enable delete for authenticated users"
on "public"."crew_roles"
as permissive
for delete
to authenticated
using (true);


create policy "Enable insert for authenticated users"
on "public"."crew_roles"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable read access for all users"
on "public"."crew_roles"
as permissive
for select
to public
using (true);


create policy "Enable update for authenticated users"
on "public"."crew_roles"
as permissive
for update
to authenticated
using (true);


create policy "Enable all operations for all users"
on "public"."customers"
as permissive
for all
to public
using (true)
with check (true);


create policy "Enable delete for authenticated users"
on "public"."customers"
as permissive
for delete
to public
using ((auth.role() = 'authenticated'::text));


create policy "Enable insert for authenticated users"
on "public"."customers"
as permissive
for insert
to public
with check ((auth.role() = 'authenticated'::text));


create policy "Enable read access for all users"
on "public"."customers"
as permissive
for select
to public
using (true);


create policy "Enable update for authenticated users"
on "public"."customers"
as permissive
for update
to public
using ((auth.role() = 'authenticated'::text));


create policy "Enable delete for development sessions"
on "public"."development_sessions"
as permissive
for delete
to anon, authenticated
using (true);


create policy "Enable insert for development sessions"
on "public"."development_sessions"
as permissive
for insert
to anon, authenticated
with check (true);


create policy "Enable select for development sessions"
on "public"."development_sessions"
as permissive
for select
to anon, authenticated
using (true);


create policy "Enable update for development sessions"
on "public"."development_sessions"
as permissive
for update
to anon, authenticated
using (true);


create policy "Enable all operations for all users"
on "public"."equipment"
as permissive
for all
to public
using (true)
with check (true);


create policy "Enable delete for authenticated users"
on "public"."equipment_folders"
as permissive
for delete
to authenticated
using (true);


create policy "Enable insert for authenticated users"
on "public"."equipment_folders"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable read access for all users"
on "public"."equipment_folders"
as permissive
for select
to public
using (true);


create policy "Enable update for authenticated users"
on "public"."equipment_folders"
as permissive
for update
to authenticated
using (true);


create policy "Enable all access for authenticated users"
on "public"."equipment_groups"
as permissive
for all
to authenticated
using (true)
with check (true);


create policy "Enable read access for all users"
on "public"."equipment_groups"
as permissive
for select
to public
using (true);


create policy "Enable all access for authenticated users"
on "public"."equipment_repairs"
as permissive
for all
to public
using ((auth.role() = 'authenticated'::text));


create policy "Enable all operations for all users"
on "public"."equipment_serial_numbers"
as permissive
for all
to public
using (true)
with check (true);


create policy "Enable all operations for all users"
on "public"."event_types"
as permissive
for all
to public
using (true)
with check (true);


create policy "Enable all operations for all users"
on "public"."project_crew"
as permissive
for all
to public
using (true)
with check (true);


create policy "Enable all operations for all users"
on "public"."project_equipment"
as permissive
for all
to public
using (true)
with check (true);


create policy "Enable all access for authenticated users"
on "public"."project_equipment_groups"
as permissive
for all
to public
using ((auth.role() = 'authenticated'::text));


create policy "Enable all operations for authenticated users"
on "public"."project_event_equipment"
as permissive
for all
to authenticated
using (true);


create policy "Enable all operations for all users"
on "public"."project_event_roles"
as permissive
for all
to public
using (true)
with check (true);


create policy "Enable delete for authenticated users"
on "public"."project_event_roles"
as permissive
for delete
to public
using ((auth.role() = 'authenticated'::text));


create policy "Enable insert for authenticated users"
on "public"."project_event_roles"
as permissive
for insert
to public
with check ((auth.role() = 'authenticated'::text));


create policy "Enable update for authenticated users"
on "public"."project_event_roles"
as permissive
for update
to public
using ((auth.role() = 'authenticated'::text));


create policy "Enable all operations for all users"
on "public"."project_events"
as permissive
for all
to public
using (true)
with check (true);


create policy "Enable delete for authenticated users"
on "public"."project_events"
as permissive
for delete
to authenticated
using (true);


create policy "Enable insert for authenticated users"
on "public"."project_events"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable read access for authenticated users"
on "public"."project_events"
as permissive
for select
to authenticated
using (true);


create policy "Enable update for authenticated users"
on "public"."project_events"
as permissive
for update
to authenticated
using (true)
with check (true);


create policy "Enable all operations for all users"
on "public"."project_roles"
as permissive
for all
to public
using (true)
with check (true);


create policy "Enable delete for authenticated users"
on "public"."project_roles"
as permissive
for delete
to public
using ((auth.role() = 'authenticated'::text));


create policy "Enable insert for authenticated users"
on "public"."project_roles"
as permissive
for insert
to public
with check ((auth.role() = 'authenticated'::text));


create policy "Enable update for authenticated users"
on "public"."project_roles"
as permissive
for update
to public
using ((auth.role() = 'authenticated'::text));


create policy "Enable all operations for authenticated users"
on "public"."project_types"
as permissive
for all
to authenticated
using (true);


create policy "Enable read access for all users"
on "public"."project_types"
as permissive
for select
to authenticated
using (true);


create policy "Enable all operations for all users"
on "public"."projects"
as permissive
for all
to public
using (true)
with check (true);


create policy "Enable delete for authenticated users"
on "public"."revenue_events"
as permissive
for delete
to authenticated
using (true);


create policy "Enable insert for authenticated users"
on "public"."revenue_events"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable read access for authenticated users"
on "public"."revenue_events"
as permissive
for select
to authenticated
using (true);


create policy "Enable update for authenticated users"
on "public"."revenue_events"
as permissive
for update
to authenticated
using (true);


create policy "Enable all operations for authenticated users"
on "public"."sync_operations"
as permissive
for all
to authenticated
using (true)
with check (true);


CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.crew_folders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.crew_member_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.crew_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER sync_user_avatar_trigger AFTER UPDATE OF auth_id ON public.crew_members FOR EACH ROW EXECUTE FUNCTION sync_user_avatar();

CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.crew_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.equipment_folders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.equipment_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.equipment_repairs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.equipment_serial_numbers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_on_serial_number_change AFTER INSERT OR DELETE OR UPDATE ON public.equipment_serial_numbers FOR EACH ROW EXECUTE FUNCTION update_equipment_stock();

CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.event_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.hourly_rate_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.project_crew FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER equipment_sync_trigger AFTER INSERT OR DELETE OR UPDATE ON public.project_equipment FOR EACH ROW EXECUTE FUNCTION check_equipment_sync();

CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.project_equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER sync_event_equipment_trigger AFTER UPDATE OF quantity ON public.project_equipment FOR EACH ROW EXECUTE FUNCTION sync_event_equipment();

CREATE TRIGGER update_group_prices_trigger AFTER INSERT OR DELETE OR UPDATE ON public.project_equipment FOR EACH ROW EXECUTE FUNCTION update_group_prices();

CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.project_equipment_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.project_event_equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_prices_trigger AFTER INSERT OR DELETE OR UPDATE ON public.project_event_equipment FOR EACH ROW EXECUTE FUNCTION update_event_prices();

CREATE TRIGGER calculate_role_cost_trigger BEFORE INSERT OR UPDATE OF hours_worked, hourly_rate, hourly_category ON public.project_event_roles FOR EACH ROW EXECUTE FUNCTION update_event_role_cost();

CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.project_event_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER collect_revenue_data AFTER INSERT OR UPDATE ON public.project_events FOR EACH ROW EXECUTE FUNCTION update_revenue_events();

CREATE TRIGGER on_event_created AFTER INSERT ON public.project_events FOR EACH ROW EXECUTE FUNCTION create_event_equipment();

CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.project_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_to_be_invoiced_trigger AFTER UPDATE OF status ON public.project_events FOR EACH ROW EXECUTE FUNCTION update_project_to_be_invoiced();

CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.project_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.project_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.revenue_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


