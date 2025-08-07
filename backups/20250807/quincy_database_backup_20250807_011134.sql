

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


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgsodium";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."event_status" AS ENUM (
    'proposed',
    'confirmed',
    'cancelled'
);


ALTER TYPE "public"."event_status" OWNER TO "postgres";


CREATE TYPE "public"."hourly_rate_category" AS ENUM (
    'flat',
    'corporate',
    'broadcast'
);


ALTER TYPE "public"."hourly_rate_category" OWNER TO "postgres";


CREATE TYPE "public"."project_type" AS ENUM (
    'artist',
    'corporate',
    'broadcast',
    'dry_hire'
);


ALTER TYPE "public"."project_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_hourly_cost"("p_hours" numeric, "p_hourly_rate" numeric, "p_category" "public"."hourly_rate_category") RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."calculate_hourly_cost"("p_hours" numeric, "p_hourly_rate" numeric, "p_category" "public"."hourly_rate_category") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_hourly_cost"("p_hours" numeric, "p_hourly_rate" numeric, "p_category" "public"."hourly_rate_category", "p_is_artist" boolean DEFAULT false, "p_is_hours_event" boolean DEFAULT false) RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."calculate_hourly_cost"("p_hours" numeric, "p_hourly_rate" numeric, "p_category" "public"."hourly_rate_category", "p_is_artist" boolean, "p_is_hours_event" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_equipment_sync"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."check_equipment_sync"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_default_variant_for_project"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Insert default variant for the new project (ignore conflicts)
    INSERT INTO project_variants (project_id, variant_name, description, is_default, sort_order)
    VALUES (
        NEW.id,
        'default',
        'Default configuration for equipment and crew',
        true,
        0
    )
    ON CONFLICT (project_id, variant_name) DO NOTHING;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_default_variant_for_project"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_event_equipment"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."create_event_equipment"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_all_avatars"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE crew_members cm
    SET avatar_url = (
        SELECT raw_user_meta_data->>'avatar_url'
        FROM auth.users au
        WHERE au.id = cm.auth_id
    )
    WHERE cm.auth_id IS NOT NULL;
END;
$$;


ALTER FUNCTION "public"."sync_all_avatars"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_equipment_folder_name"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update equipment table when folder name changes
    UPDATE equipment 
    SET "Folder" = NEW.name
    WHERE folder_id = NEW.id;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_equipment_folder_name"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_event_crew"("p_event_id" "uuid", "p_project_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."sync_event_crew"("p_event_id" "uuid", "p_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_event_crew"("p_event_id" "uuid", "p_project_id" "uuid", "p_variant_name" "text" DEFAULT 'default'::"text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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
  
  -- Insert project crew roles for the specified variant with deduplication and conflict resolution
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
    AND variant_name = p_variant_name  -- NEW: Filter by variant
  ORDER BY role_id, updated_at DESC -- Use most recent entry if duplicates exist
  ON CONFLICT (event_id, role_id) 
  DO UPDATE SET 
    crew_member_id = EXCLUDED.crew_member_id,
    daily_rate = EXCLUDED.daily_rate,
    hourly_rate = EXCLUDED.hourly_rate,
    hourly_category = EXCLUDED.hourly_category,
    total_cost = EXCLUDED.total_cost,
    updated_at = NOW();

  -- Calculate and update crew_price (following equipment pattern)
  -- This calculates cost from project role requirements (customer-facing)
  UPDATE project_events 
  SET 
    crew_price = COALESCE((
      SELECT SUM(COALESCE(daily_rate, 0) * v_crew_rate_multiplier)
      FROM project_roles 
      WHERE project_id = p_project_id
        AND variant_name = p_variant_name  -- NEW: Filter by variant
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
$$;


ALTER FUNCTION "public"."sync_event_crew"("p_event_id" "uuid", "p_project_id" "uuid", "p_variant_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_event_equipment"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."sync_event_equipment"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_event_equipment"("p_event_id" "uuid", "p_project_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Just call the unified function
  PERFORM sync_event_equipment_unified(p_event_id, p_project_id);
END;
$$;


ALTER FUNCTION "public"."sync_event_equipment"("p_event_id" "uuid", "p_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_event_equipment_unified"("p_event_id" "uuid", "p_project_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."sync_event_equipment_unified"("p_event_id" "uuid", "p_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_event_equipment_unified"("p_event_id" "uuid", "p_project_id" "uuid", "p_variant_name" "text" DEFAULT 'default'::"text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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
  
  -- Insert project equipment for the specified variant with proper pricing calculation
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
    AND pe.variant_name = p_variant_name  -- NEW: Filter by variant
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
$$;


ALTER FUNCTION "public"."sync_event_equipment_unified"("p_event_id" "uuid", "p_project_id" "uuid", "p_variant_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_event_variant"("p_event_id" "uuid", "p_project_id" "uuid", "p_variant_name" "text" DEFAULT 'default'::"text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Update the event's variant
  UPDATE project_events 
  SET variant_name = p_variant_name,
      updated_at = NOW()
  WHERE id = p_event_id AND project_id = p_project_id;

  -- Sync equipment for the variant
  PERFORM sync_event_equipment_unified(p_event_id, p_project_id, p_variant_name);
  
  -- Sync crew for the variant
  PERFORM sync_event_crew(p_event_id, p_project_id, p_variant_name);
  
END;
$$;


ALTER FUNCTION "public"."sync_event_variant"("p_event_id" "uuid", "p_project_id" "uuid", "p_variant_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_user_avatar"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."sync_user_avatar"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_equipment_stock"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."update_equipment_stock"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_event_prices"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."update_event_prices"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_event_role_cost"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."update_event_role_cost"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_group_prices"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."update_group_prices"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_group_sort_orders"("p_project_id" "uuid", "p_source_group_id" "uuid", "p_target_sort_order" integer, "p_direction" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."update_group_sort_orders"("p_project_id" "uuid", "p_source_group_id" "uuid", "p_target_sort_order" integer, "p_direction" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_project_to_be_invoiced"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."update_project_to_be_invoiced"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_project_variants_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_project_variants_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_revenue_events"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."update_revenue_events"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."crew_folders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);

ALTER TABLE ONLY "public"."crew_folders" REPLICA IDENTITY FULL;


ALTER TABLE "public"."crew_folders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crew_member_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "crew_member_id" "uuid",
    "role_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."crew_member_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crew_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "folder_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "auth_id" "uuid",
    "avatar_url" "text"
);


ALTER TABLE "public"."crew_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crew_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "color" "text" DEFAULT '#000000'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."crew_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "customer_number" "text",
    "organization_number" "text",
    "email" "text",
    "phone_number" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "tripletex_id" bigint
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."development_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."development_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."equipment" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text",
    "name" "text" NOT NULL,
    "weight" numeric(10,2),
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "rental_price" numeric,
    "stock_calculation" "text",
    "stock" numeric,
    "internal_remark" "text",
    "folder_id" "uuid",
    CONSTRAINT "equipment_stock_calculation_check" CHECK (("stock_calculation" = ANY (ARRAY['manual'::"text", 'serial_numbers'::"text", 'consumable'::"text"])))
);


ALTER TABLE "public"."equipment" OWNER TO "postgres";


COMMENT ON COLUMN "public"."equipment"."rental_price" IS 'Daily rental price for the equipment';



COMMENT ON COLUMN "public"."equipment"."stock_calculation" IS 'Method used for stock calculation (e.g., serial_numbers)';



COMMENT ON COLUMN "public"."equipment"."stock" IS 'Current stock quantity';



COMMENT ON COLUMN "public"."equipment"."internal_remark" IS 'Internal notes about the equipment';



CREATE TABLE IF NOT EXISTS "public"."equipment_folders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "parent_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."equipment_folders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."equipment_groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."equipment_groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."equipment_repairs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "equipment_id" "uuid",
    "serial_numbers" "text"[],
    "quantity" integer DEFAULT 1,
    "description" "text" NOT NULL,
    "can_be_used" boolean DEFAULT false,
    "start_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "end_date" "date",
    "status" "text" DEFAULT 'open'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."equipment_repairs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."equipment_serial_numbers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "equipment_id" "uuid",
    "serial_number" "text" NOT NULL,
    "status" "text" DEFAULT 'Available'::"text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."equipment_serial_numbers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "color" "text" NOT NULL,
    "needs_crew" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "needs_equipment" boolean DEFAULT true,
    "equipment_rate_multiplier" numeric DEFAULT 1.0,
    "allows_discount" boolean DEFAULT false,
    "rate_type" "text" DEFAULT 'daily'::"text",
    "crew_rate_multiplier" numeric DEFAULT 1.0,
    CONSTRAINT "event_types_rate_type_check" CHECK (("rate_type" = ANY (ARRAY['hourly'::"text", 'daily'::"text"])))
);


ALTER TABLE "public"."event_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hourly_rate_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category" "public"."hourly_rate_category" NOT NULL,
    "overtime_threshold" integer DEFAULT 8,
    "overtime_multiplier" numeric DEFAULT 1.5,
    "double_time_threshold" integer DEFAULT 12,
    "double_time_multiplier" numeric DEFAULT 2.0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."hourly_rate_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_crew" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "crew_member_id" "uuid",
    "role_id" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."project_crew" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_equipment" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "equipment_id" "uuid",
    "quantity" integer DEFAULT 1,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "group_id" "uuid",
    "variant_name" "text" DEFAULT 'default'::"text" NOT NULL
);


ALTER TABLE "public"."project_equipment" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_equipment_groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "name" "text" NOT NULL,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "total_price" numeric DEFAULT 0,
    "variant_name" "text" DEFAULT 'default'::"text" NOT NULL
);


ALTER TABLE "public"."project_equipment_groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_event_equipment" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "event_id" "uuid",
    "equipment_id" "uuid",
    "quantity" integer DEFAULT 1,
    "group_id" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "is_synced" boolean DEFAULT true
);


ALTER TABLE "public"."project_event_equipment" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_event_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "event_id" "uuid",
    "role_id" "uuid",
    "crew_member_id" "uuid",
    "daily_rate" numeric,
    "hourly_rate" numeric,
    "hours_worked" numeric(10,1),
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "hourly_category" "public"."hourly_rate_category" DEFAULT 'flat'::"public"."hourly_rate_category",
    "total_cost" numeric,
    CONSTRAINT "hours_worked_increment" CHECK ((("hours_worked" % 0.5) = (0)::numeric))
);


ALTER TABLE "public"."project_event_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "date" "date" NOT NULL,
    "name" "text" NOT NULL,
    "event_type_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "status" "text" DEFAULT 'proposed'::"text" NOT NULL,
    "location" "text",
    "equipment_price" numeric DEFAULT 0,
    "total_price" numeric DEFAULT 0,
    "crew_price" numeric DEFAULT 0,
    "variant_name" "text" DEFAULT 'default'::"text" NOT NULL,
    CONSTRAINT "simple_event_variant" CHECK ((("char_length"("variant_name") >= 1) AND ("char_length"("variant_name") <= 50)))
);


ALTER TABLE "public"."project_events" OWNER TO "postgres";


COMMENT ON COLUMN "public"."project_events"."location" IS 'General location like cities or towns, not specific addresses';



CREATE SEQUENCE IF NOT EXISTS "public"."project_number_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."project_number_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "role_id" "uuid",
    "daily_rate" numeric,
    "hourly_rate" numeric,
    "preferred_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "hourly_category" "public"."hourly_rate_category" DEFAULT 'flat'::"public"."hourly_rate_category",
    "variant_name" "text" DEFAULT 'default'::"text" NOT NULL
);


ALTER TABLE "public"."project_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "code" "text" NOT NULL,
    "price_multiplier" numeric DEFAULT 1.0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."project_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_variants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "variant_name" "text" NOT NULL,
    "description" "text",
    "is_default" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "simple_variant_name" CHECK ((("char_length"("variant_name") >= 1) AND ("char_length"("variant_name") <= 50))),
    CONSTRAINT "valid_sort_order" CHECK (("sort_order" >= 0))
);


ALTER TABLE "public"."project_variants" OWNER TO "postgres";


COMMENT ON TABLE "public"."project_variants" IS 'Configuration for project performance variants (e.g., Trio, Band, DJ setups)';



COMMENT ON COLUMN "public"."project_variants"."variant_name" IS 'Variant name used for both technical identification and user display';



COMMENT ON COLUMN "public"."project_variants"."is_default" IS 'Whether this is the default variant for the project';



COMMENT ON COLUMN "public"."project_variants"."sort_order" IS 'Display order in UI (lower numbers first)';



CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "project_number" numeric DEFAULT "nextval"('"public"."project_number_seq"'::"regclass") NOT NULL,
    "customer_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "owner_id" "uuid",
    "color" "text" DEFAULT 'violet'::"text",
    "to_be_invoiced" numeric DEFAULT 0,
    "is_archived" boolean DEFAULT false,
    "project_type_id" "uuid"
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."revenue_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "total_price" numeric DEFAULT 0 NOT NULL,
    "status" "public"."event_status" DEFAULT 'proposed'::"public"."event_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."revenue_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sync_operations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "event_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "attempts" integer DEFAULT 0,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."sync_operations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."temp_equipment" (
    "created" timestamp with time zone,
    "name" "text",
    "code" "text",
    "internal_remark" "text",
    "rental_price" numeric,
    "stock_calculation" "text",
    "weight" numeric,
    "stock" numeric,
    "equipment_folder" "text",
    "serial_number" "text"
);


ALTER TABLE "public"."temp_equipment" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."variant_statistics" AS
 SELECT "pt"."name" AS "project_type",
    "count"(DISTINCT "p"."id") AS "total_projects",
    "count"(DISTINCT "pv"."project_id") AS "projects_with_variants",
    "count"("pv"."id") AS "total_variants",
    "count"(
        CASE
            WHEN "pv"."is_default" THEN 1
            ELSE NULL::integer
        END) AS "default_variants"
   FROM (("public"."project_types" "pt"
     LEFT JOIN "public"."projects" "p" ON (("p"."project_type_id" = "pt"."id")))
     LEFT JOIN "public"."project_variants" "pv" ON (("pv"."project_id" = "p"."id")))
  GROUP BY "pt"."id", "pt"."name"
  ORDER BY "pt"."name";


ALTER TABLE "public"."variant_statistics" OWNER TO "postgres";


COMMENT ON VIEW "public"."variant_statistics" IS 'Summary statistics for project variants by project type';



ALTER TABLE ONLY "public"."crew_folders"
    ADD CONSTRAINT "crew_folders_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."crew_folders"
    ADD CONSTRAINT "crew_folders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crew_member_roles"
    ADD CONSTRAINT "crew_member_roles_crew_member_id_role_id_key" UNIQUE ("crew_member_id", "role_id");



ALTER TABLE ONLY "public"."crew_member_roles"
    ADD CONSTRAINT "crew_member_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crew_members"
    ADD CONSTRAINT "crew_members_auth_id_key" UNIQUE ("auth_id");



ALTER TABLE ONLY "public"."crew_members"
    ADD CONSTRAINT "crew_members_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."crew_members"
    ADD CONSTRAINT "crew_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crew_roles"
    ADD CONSTRAINT "crew_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_tripletex_id_key" UNIQUE ("tripletex_id");



ALTER TABLE ONLY "public"."development_sessions"
    ADD CONSTRAINT "development_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."equipment_folders"
    ADD CONSTRAINT "equipment_folders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."equipment_groups"
    ADD CONSTRAINT "equipment_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."equipment"
    ADD CONSTRAINT "equipment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."equipment_repairs"
    ADD CONSTRAINT "equipment_repairs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."equipment_serial_numbers"
    ADD CONSTRAINT "equipment_serial_numbers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_types"
    ADD CONSTRAINT "event_types_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."event_types"
    ADD CONSTRAINT "event_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hourly_rate_settings"
    ADD CONSTRAINT "hourly_rate_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_crew"
    ADD CONSTRAINT "project_crew_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_crew"
    ADD CONSTRAINT "project_crew_project_id_crew_member_id_key" UNIQUE ("project_id", "crew_member_id");



ALTER TABLE ONLY "public"."project_equipment_groups"
    ADD CONSTRAINT "project_equipment_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_equipment_groups"
    ADD CONSTRAINT "project_equipment_groups_project_variant_name_key" UNIQUE ("project_id", "name", "variant_name");



ALTER TABLE ONLY "public"."project_equipment"
    ADD CONSTRAINT "project_equipment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_equipment"
    ADD CONSTRAINT "project_equipment_project_id_equipment_id_group_id_key" UNIQUE ("project_id", "equipment_id", "group_id");



ALTER TABLE ONLY "public"."project_event_equipment"
    ADD CONSTRAINT "project_event_equipment_event_id_equipment_id_key" UNIQUE ("event_id", "equipment_id");



ALTER TABLE ONLY "public"."project_event_equipment"
    ADD CONSTRAINT "project_event_equipment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_event_roles"
    ADD CONSTRAINT "project_event_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_events"
    ADD CONSTRAINT "project_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "project_number_unique" UNIQUE ("project_number");



ALTER TABLE ONLY "public"."project_roles"
    ADD CONSTRAINT "project_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_types"
    ADD CONSTRAINT "project_types_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."project_types"
    ADD CONSTRAINT "project_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_variants"
    ADD CONSTRAINT "project_variants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."revenue_events"
    ADD CONSTRAINT "revenue_events_date_status_key" UNIQUE ("date", "status");



ALTER TABLE ONLY "public"."revenue_events"
    ADD CONSTRAINT "revenue_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sync_operations"
    ADD CONSTRAINT "sync_operations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_event_roles"
    ADD CONSTRAINT "unique_event_role" UNIQUE ("event_id", "role_id");



ALTER TABLE ONLY "public"."project_roles"
    ADD CONSTRAINT "unique_project_role" UNIQUE ("project_id", "role_id");



ALTER TABLE ONLY "public"."project_variants"
    ADD CONSTRAINT "unique_project_variant" UNIQUE ("project_id", "variant_name");



CREATE INDEX "idx_equipment_code" ON "public"."equipment" USING "btree" ("code");



CREATE INDEX "idx_equipment_folder_id" ON "public"."equipment" USING "btree" ("folder_id");



CREATE INDEX "idx_equipment_serial_numbers_equipment_id" ON "public"."equipment_serial_numbers" USING "btree" ("equipment_id");



CREATE INDEX "idx_equipment_serial_numbers_serial_number" ON "public"."equipment_serial_numbers" USING "btree" ("serial_number");



CREATE INDEX "idx_project_equipment_groups_variant" ON "public"."project_equipment_groups" USING "btree" ("project_id", "variant_name");



CREATE INDEX "idx_project_equipment_groups_variant_lookup" ON "public"."project_equipment_groups" USING "btree" ("project_id", "variant_name") INCLUDE ("name", "sort_order", "total_price");



CREATE INDEX "idx_project_equipment_variant" ON "public"."project_equipment" USING "btree" ("project_id", "variant_name");



CREATE INDEX "idx_project_equipment_variant_lookup" ON "public"."project_equipment" USING "btree" ("project_id", "variant_name") INCLUDE ("equipment_id", "quantity", "group_id");



CREATE INDEX "idx_project_event_equipment_sync" ON "public"."project_event_equipment" USING "btree" ("event_id", "equipment_id", "is_synced");



CREATE INDEX "idx_project_events_variant" ON "public"."project_events" USING "btree" ("project_id", "variant_name");



CREATE INDEX "idx_project_events_variant_date" ON "public"."project_events" USING "btree" ("project_id", "variant_name", "date");



CREATE INDEX "idx_project_roles_variant" ON "public"."project_roles" USING "btree" ("project_id", "variant_name");



CREATE INDEX "idx_project_roles_variant_lookup" ON "public"."project_roles" USING "btree" ("project_id", "variant_name") INCLUDE ("role_id", "daily_rate", "preferred_id");



CREATE INDEX "idx_project_variants_project" ON "public"."project_variants" USING "btree" ("project_id");



CREATE INDEX "idx_project_variants_project_sort" ON "public"."project_variants" USING "btree" ("project_id", "sort_order");



CREATE UNIQUE INDEX "idx_project_variants_unique_default" ON "public"."project_variants" USING "btree" ("project_id") WHERE ("is_default" = true);



CREATE INDEX "idx_projects_is_archived" ON "public"."projects" USING "btree" ("is_archived");



CREATE INDEX "sync_operations_project_event_idx" ON "public"."sync_operations" USING "btree" ("project_id", "event_id");



CREATE OR REPLACE TRIGGER "calculate_role_cost_trigger" BEFORE INSERT OR UPDATE OF "hours_worked", "hourly_rate", "hourly_category" ON "public"."project_event_roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_event_role_cost"();



CREATE OR REPLACE TRIGGER "collect_revenue_data" AFTER INSERT OR UPDATE ON "public"."project_events" FOR EACH ROW EXECUTE FUNCTION "public"."update_revenue_events"();



CREATE OR REPLACE TRIGGER "equipment_sync_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."project_equipment" FOR EACH ROW EXECUTE FUNCTION "public"."check_equipment_sync"();



CREATE OR REPLACE TRIGGER "on_event_created" AFTER INSERT ON "public"."project_events" FOR EACH ROW EXECUTE FUNCTION "public"."create_event_equipment"();



CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."crew_folders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."crew_member_roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."crew_members" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."crew_roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."customers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."equipment" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."equipment_folders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."equipment_groups" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."equipment_repairs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."equipment_serial_numbers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."event_types" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."hourly_rate_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."project_crew" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."project_equipment" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."project_equipment_groups" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."project_event_equipment" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."project_event_roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."project_events" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."project_roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."project_types" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."revenue_events" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "sync_event_equipment_trigger" AFTER UPDATE OF "quantity" ON "public"."project_equipment" FOR EACH ROW EXECUTE FUNCTION "public"."sync_event_equipment"();



CREATE OR REPLACE TRIGGER "sync_user_avatar_trigger" AFTER UPDATE OF "auth_id" ON "public"."crew_members" FOR EACH ROW EXECUTE FUNCTION "public"."sync_user_avatar"();



CREATE OR REPLACE TRIGGER "trigger_create_default_variant" AFTER INSERT ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."create_default_variant_for_project"();



CREATE OR REPLACE TRIGGER "update_event_prices_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."project_event_equipment" FOR EACH ROW EXECUTE FUNCTION "public"."update_event_prices"();



CREATE OR REPLACE TRIGGER "update_group_prices_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."project_equipment" FOR EACH ROW EXECUTE FUNCTION "public"."update_group_prices"();



CREATE OR REPLACE TRIGGER "update_project_to_be_invoiced_trigger" AFTER UPDATE OF "status" ON "public"."project_events" FOR EACH ROW EXECUTE FUNCTION "public"."update_project_to_be_invoiced"();



CREATE OR REPLACE TRIGGER "update_project_variants_updated_at" BEFORE UPDATE ON "public"."project_variants" FOR EACH ROW EXECUTE FUNCTION "public"."update_project_variants_updated_at"();



CREATE OR REPLACE TRIGGER "update_stock_on_serial_number_change" AFTER INSERT OR DELETE OR UPDATE ON "public"."equipment_serial_numbers" FOR EACH ROW EXECUTE FUNCTION "public"."update_equipment_stock"();



ALTER TABLE ONLY "public"."crew_members"
    ADD CONSTRAINT "crew_members_auth_id_fkey" FOREIGN KEY ("auth_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."crew_members"
    ADD CONSTRAINT "crew_members_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "public"."crew_folders"("id");



ALTER TABLE ONLY "public"."equipment"
    ADD CONSTRAINT "equipment_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "public"."equipment_folders"("id");



ALTER TABLE ONLY "public"."equipment_folders"
    ADD CONSTRAINT "equipment_folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."equipment_folders"("id");



ALTER TABLE ONLY "public"."equipment_repairs"
    ADD CONSTRAINT "equipment_repairs_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."equipment_serial_numbers"
    ADD CONSTRAINT "equipment_serial_numbers_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_crew"
    ADD CONSTRAINT "project_crew_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_equipment"
    ADD CONSTRAINT "project_equipment_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_equipment"
    ADD CONSTRAINT "project_equipment_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."project_equipment_groups"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_equipment_groups"
    ADD CONSTRAINT "project_equipment_groups_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_equipment"
    ADD CONSTRAINT "project_equipment_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_event_equipment"
    ADD CONSTRAINT "project_event_equipment_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id");



ALTER TABLE ONLY "public"."project_event_equipment"
    ADD CONSTRAINT "project_event_equipment_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."project_events"("id");



ALTER TABLE ONLY "public"."project_event_equipment"
    ADD CONSTRAINT "project_event_equipment_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."project_equipment_groups"("id");



ALTER TABLE ONLY "public"."project_event_equipment"
    ADD CONSTRAINT "project_event_equipment_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id");



ALTER TABLE ONLY "public"."project_event_roles"
    ADD CONSTRAINT "project_event_roles_crew_member_id_fkey" FOREIGN KEY ("crew_member_id") REFERENCES "public"."crew_members"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_event_roles"
    ADD CONSTRAINT "project_event_roles_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."project_events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_event_roles"
    ADD CONSTRAINT "project_event_roles_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_event_roles"
    ADD CONSTRAINT "project_event_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."crew_roles"("id");



ALTER TABLE ONLY "public"."project_events"
    ADD CONSTRAINT "project_events_event_type_id_fkey" FOREIGN KEY ("event_type_id") REFERENCES "public"."event_types"("id");



ALTER TABLE ONLY "public"."project_events"
    ADD CONSTRAINT "project_events_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id");



ALTER TABLE ONLY "public"."project_roles"
    ADD CONSTRAINT "project_roles_preferred_id_fkey" FOREIGN KEY ("preferred_id") REFERENCES "public"."crew_members"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_roles"
    ADD CONSTRAINT "project_roles_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_roles"
    ADD CONSTRAINT "project_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."crew_roles"("id");



ALTER TABLE ONLY "public"."project_variants"
    ADD CONSTRAINT "project_variants_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."crew_members"("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_project_type_id_fkey" FOREIGN KEY ("project_type_id") REFERENCES "public"."project_types"("id");



ALTER TABLE ONLY "public"."sync_operations"
    ADD CONSTRAINT "sync_operations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."project_events"("id");



ALTER TABLE ONLY "public"."sync_operations"
    ADD CONSTRAINT "sync_operations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id");



CREATE POLICY "Enable all access for authenticated users" ON "public"."equipment_groups" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all access for authenticated users" ON "public"."equipment_repairs" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."project_equipment_groups" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all operations for all users" ON "public"."crew_folders" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all operations for all users" ON "public"."crew_member_roles" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all operations for all users" ON "public"."crew_members" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all operations for all users" ON "public"."crew_roles" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all operations for all users" ON "public"."customers" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all operations for all users" ON "public"."equipment" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all operations for all users" ON "public"."equipment_serial_numbers" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all operations for all users" ON "public"."event_types" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all operations for all users" ON "public"."project_crew" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all operations for all users" ON "public"."project_equipment" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all operations for all users" ON "public"."project_event_roles" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all operations for all users" ON "public"."project_events" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all operations for all users" ON "public"."project_roles" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all operations for all users" ON "public"."projects" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all operations for authenticated users" ON "public"."project_event_equipment" TO "authenticated" USING (true);



CREATE POLICY "Enable all operations for authenticated users" ON "public"."project_types" TO "authenticated" USING (true);



CREATE POLICY "Enable all operations for authenticated users" ON "public"."sync_operations" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Enable complete access for authenticated users" ON "public"."crew_members" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Enable delete for authenticated users" ON "public"."crew_folders" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Enable delete for authenticated users" ON "public"."crew_member_roles" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Enable delete for authenticated users" ON "public"."crew_members" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Enable delete for authenticated users" ON "public"."crew_roles" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Enable delete for authenticated users" ON "public"."customers" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable delete for authenticated users" ON "public"."equipment_folders" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Enable delete for authenticated users" ON "public"."project_event_roles" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable delete for authenticated users" ON "public"."project_events" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Enable delete for authenticated users" ON "public"."project_roles" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable delete for authenticated users" ON "public"."revenue_events" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Enable delete for development sessions" ON "public"."development_sessions" FOR DELETE TO "authenticated", "anon" USING (true);



CREATE POLICY "Enable insert for authenticated users" ON "public"."crew_folders" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users" ON "public"."crew_member_roles" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users" ON "public"."crew_members" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users" ON "public"."crew_roles" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users" ON "public"."customers" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for authenticated users" ON "public"."equipment_folders" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users" ON "public"."project_event_roles" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for authenticated users" ON "public"."project_events" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users" ON "public"."project_roles" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for authenticated users" ON "public"."revenue_events" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for development sessions" ON "public"."development_sessions" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Enable public access to crew_member_roles" ON "public"."crew_member_roles" USING (true) WITH CHECK (true);



CREATE POLICY "Enable public access to crew_members" ON "public"."crew_members" USING (true) WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."crew_folders" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."crew_roles" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."customers" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."equipment_folders" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."equipment_groups" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."project_types" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for authenticated users" ON "public"."crew_member_roles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for authenticated users" ON "public"."crew_members" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for authenticated users" ON "public"."project_events" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for authenticated users" ON "public"."revenue_events" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable select for development sessions" ON "public"."development_sessions" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Enable update for authenticated users" ON "public"."crew_folders" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Enable update for authenticated users" ON "public"."crew_member_roles" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Enable update for authenticated users" ON "public"."crew_members" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Enable update for authenticated users" ON "public"."crew_roles" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Enable update for authenticated users" ON "public"."customers" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update for authenticated users" ON "public"."equipment_folders" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Enable update for authenticated users" ON "public"."project_event_roles" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update for authenticated users" ON "public"."project_events" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Enable update for authenticated users" ON "public"."project_roles" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update for authenticated users" ON "public"."revenue_events" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Enable update for development sessions" ON "public"."development_sessions" FOR UPDATE TO "authenticated", "anon" USING (true);



CREATE POLICY "Users can modify project variants they have access to" ON "public"."project_variants" USING (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects")));



CREATE POLICY "Users can view project variants they have access to" ON "public"."project_variants" FOR SELECT USING (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects")));



CREATE POLICY "Users can view their own crew member data" ON "public"."crew_members" FOR SELECT TO "authenticated" USING (("auth_id" = "auth"."uid"()));



ALTER TABLE "public"."crew_folders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crew_member_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crew_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crew_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."development_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."equipment" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."equipment_folders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."equipment_groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."equipment_repairs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."equipment_serial_numbers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hourly_rate_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_crew" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_equipment" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_equipment_groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_event_equipment" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_event_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_variants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."revenue_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sync_operations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."temp_equipment" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."crew_folders";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";












































































































































































































GRANT ALL ON FUNCTION "public"."calculate_hourly_cost"("p_hours" numeric, "p_hourly_rate" numeric, "p_category" "public"."hourly_rate_category") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_hourly_cost"("p_hours" numeric, "p_hourly_rate" numeric, "p_category" "public"."hourly_rate_category") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_hourly_cost"("p_hours" numeric, "p_hourly_rate" numeric, "p_category" "public"."hourly_rate_category") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_hourly_cost"("p_hours" numeric, "p_hourly_rate" numeric, "p_category" "public"."hourly_rate_category", "p_is_artist" boolean, "p_is_hours_event" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_hourly_cost"("p_hours" numeric, "p_hourly_rate" numeric, "p_category" "public"."hourly_rate_category", "p_is_artist" boolean, "p_is_hours_event" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_hourly_cost"("p_hours" numeric, "p_hourly_rate" numeric, "p_category" "public"."hourly_rate_category", "p_is_artist" boolean, "p_is_hours_event" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."check_equipment_sync"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_equipment_sync"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_equipment_sync"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_default_variant_for_project"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_default_variant_for_project"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_default_variant_for_project"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_event_equipment"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_event_equipment"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_event_equipment"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_all_avatars"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_all_avatars"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_all_avatars"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_equipment_folder_name"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_equipment_folder_name"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_equipment_folder_name"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_event_crew"("p_event_id" "uuid", "p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."sync_event_crew"("p_event_id" "uuid", "p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_event_crew"("p_event_id" "uuid", "p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_event_crew"("p_event_id" "uuid", "p_project_id" "uuid", "p_variant_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."sync_event_crew"("p_event_id" "uuid", "p_project_id" "uuid", "p_variant_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_event_crew"("p_event_id" "uuid", "p_project_id" "uuid", "p_variant_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_event_equipment"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_event_equipment"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_event_equipment"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_event_equipment"("p_event_id" "uuid", "p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."sync_event_equipment"("p_event_id" "uuid", "p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_event_equipment"("p_event_id" "uuid", "p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_event_equipment_unified"("p_event_id" "uuid", "p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."sync_event_equipment_unified"("p_event_id" "uuid", "p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_event_equipment_unified"("p_event_id" "uuid", "p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_event_equipment_unified"("p_event_id" "uuid", "p_project_id" "uuid", "p_variant_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."sync_event_equipment_unified"("p_event_id" "uuid", "p_project_id" "uuid", "p_variant_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_event_equipment_unified"("p_event_id" "uuid", "p_project_id" "uuid", "p_variant_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_event_variant"("p_event_id" "uuid", "p_project_id" "uuid", "p_variant_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."sync_event_variant"("p_event_id" "uuid", "p_project_id" "uuid", "p_variant_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_event_variant"("p_event_id" "uuid", "p_project_id" "uuid", "p_variant_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_user_avatar"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_user_avatar"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_user_avatar"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_equipment_stock"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_equipment_stock"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_equipment_stock"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_event_prices"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_event_prices"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_event_prices"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_event_role_cost"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_event_role_cost"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_event_role_cost"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_group_prices"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_group_prices"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_group_prices"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_group_sort_orders"("p_project_id" "uuid", "p_source_group_id" "uuid", "p_target_sort_order" integer, "p_direction" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."update_group_sort_orders"("p_project_id" "uuid", "p_source_group_id" "uuid", "p_target_sort_order" integer, "p_direction" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_group_sort_orders"("p_project_id" "uuid", "p_source_group_id" "uuid", "p_target_sort_order" integer, "p_direction" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_project_to_be_invoiced"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_project_to_be_invoiced"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_project_to_be_invoiced"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_project_variants_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_project_variants_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_project_variants_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_revenue_events"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_revenue_events"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_revenue_events"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";
























GRANT ALL ON TABLE "public"."crew_folders" TO "anon";
GRANT ALL ON TABLE "public"."crew_folders" TO "authenticated";
GRANT ALL ON TABLE "public"."crew_folders" TO "service_role";



GRANT ALL ON TABLE "public"."crew_member_roles" TO "anon";
GRANT ALL ON TABLE "public"."crew_member_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."crew_member_roles" TO "service_role";



GRANT ALL ON TABLE "public"."crew_members" TO "anon";
GRANT ALL ON TABLE "public"."crew_members" TO "authenticated";
GRANT ALL ON TABLE "public"."crew_members" TO "service_role";



GRANT ALL ON TABLE "public"."crew_roles" TO "anon";
GRANT ALL ON TABLE "public"."crew_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."crew_roles" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."development_sessions" TO "anon";
GRANT ALL ON TABLE "public"."development_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."development_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."equipment" TO "anon";
GRANT ALL ON TABLE "public"."equipment" TO "authenticated";
GRANT ALL ON TABLE "public"."equipment" TO "service_role";



GRANT ALL ON TABLE "public"."equipment_folders" TO "anon";
GRANT ALL ON TABLE "public"."equipment_folders" TO "authenticated";
GRANT ALL ON TABLE "public"."equipment_folders" TO "service_role";



GRANT ALL ON TABLE "public"."equipment_groups" TO "anon";
GRANT ALL ON TABLE "public"."equipment_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."equipment_groups" TO "service_role";



GRANT ALL ON TABLE "public"."equipment_repairs" TO "anon";
GRANT ALL ON TABLE "public"."equipment_repairs" TO "authenticated";
GRANT ALL ON TABLE "public"."equipment_repairs" TO "service_role";



GRANT ALL ON TABLE "public"."equipment_serial_numbers" TO "anon";
GRANT ALL ON TABLE "public"."equipment_serial_numbers" TO "authenticated";
GRANT ALL ON TABLE "public"."equipment_serial_numbers" TO "service_role";



GRANT ALL ON TABLE "public"."event_types" TO "anon";
GRANT ALL ON TABLE "public"."event_types" TO "authenticated";
GRANT ALL ON TABLE "public"."event_types" TO "service_role";



GRANT ALL ON TABLE "public"."hourly_rate_settings" TO "anon";
GRANT ALL ON TABLE "public"."hourly_rate_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."hourly_rate_settings" TO "service_role";



GRANT ALL ON TABLE "public"."project_crew" TO "anon";
GRANT ALL ON TABLE "public"."project_crew" TO "authenticated";
GRANT ALL ON TABLE "public"."project_crew" TO "service_role";



GRANT ALL ON TABLE "public"."project_equipment" TO "anon";
GRANT ALL ON TABLE "public"."project_equipment" TO "authenticated";
GRANT ALL ON TABLE "public"."project_equipment" TO "service_role";



GRANT ALL ON TABLE "public"."project_equipment_groups" TO "anon";
GRANT ALL ON TABLE "public"."project_equipment_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."project_equipment_groups" TO "service_role";



GRANT ALL ON TABLE "public"."project_event_equipment" TO "anon";
GRANT ALL ON TABLE "public"."project_event_equipment" TO "authenticated";
GRANT ALL ON TABLE "public"."project_event_equipment" TO "service_role";



GRANT ALL ON TABLE "public"."project_event_roles" TO "anon";
GRANT ALL ON TABLE "public"."project_event_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."project_event_roles" TO "service_role";



GRANT ALL ON TABLE "public"."project_events" TO "anon";
GRANT ALL ON TABLE "public"."project_events" TO "authenticated";
GRANT ALL ON TABLE "public"."project_events" TO "service_role";



GRANT ALL ON SEQUENCE "public"."project_number_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."project_number_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."project_number_seq" TO "service_role";



GRANT ALL ON TABLE "public"."project_roles" TO "anon";
GRANT ALL ON TABLE "public"."project_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."project_roles" TO "service_role";



GRANT ALL ON TABLE "public"."project_types" TO "anon";
GRANT ALL ON TABLE "public"."project_types" TO "authenticated";
GRANT ALL ON TABLE "public"."project_types" TO "service_role";



GRANT ALL ON TABLE "public"."project_variants" TO "anon";
GRANT ALL ON TABLE "public"."project_variants" TO "authenticated";
GRANT ALL ON TABLE "public"."project_variants" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."revenue_events" TO "anon";
GRANT ALL ON TABLE "public"."revenue_events" TO "authenticated";
GRANT ALL ON TABLE "public"."revenue_events" TO "service_role";



GRANT ALL ON TABLE "public"."sync_operations" TO "anon";
GRANT ALL ON TABLE "public"."sync_operations" TO "authenticated";
GRANT ALL ON TABLE "public"."sync_operations" TO "service_role";



GRANT ALL ON TABLE "public"."temp_equipment" TO "anon";
GRANT ALL ON TABLE "public"."temp_equipment" TO "authenticated";
GRANT ALL ON TABLE "public"."temp_equipment" TO "service_role";



GRANT ALL ON TABLE "public"."variant_statistics" TO "anon";
GRANT ALL ON TABLE "public"."variant_statistics" TO "authenticated";
GRANT ALL ON TABLE "public"."variant_statistics" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
