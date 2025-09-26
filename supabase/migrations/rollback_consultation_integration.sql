-- Rollback Script: Undo integrated lawyer consultation system changes
-- Date: 2025-09-26
-- Purpose: Safely rollback all schema changes if needed

-- WARNING: This will remove all integrated consultation data!
-- Make sure to backup your data before running this rollback!

-- Step 1: Drop consultation overview view
DROP VIEW IF EXISTS public.consultation_overview;

-- Step 2: Drop lawyer consultation discussion table
DROP TABLE IF EXISTS public.lawyer_consultation_discussions CASCADE;

-- Step 3: Drop lawyer consultations table
DROP TABLE IF EXISTS public.lawyer_consultations CASCADE;

-- Step 4: Drop custom enum type
DROP TYPE IF EXISTS lawyer_consultation_status;

-- Step 5: Remove added columns from incident_reports
ALTER TABLE public.incident_reports
DROP COLUMN IF EXISTS lawyer_consultation_started_at,
DROP COLUMN IF EXISTS lawyer_response_at,
DROP COLUMN IF EXISTS consultation_priority,
DROP COLUMN IF EXISTS requires_legal_consultation,
DROP COLUMN IF EXISTS consultation_notes,
DROP COLUMN IF EXISTS assigned_by;

-- Step 6: Drop custom indexes that were added
DROP INDEX IF EXISTS idx_incident_reports_consultation_priority;
DROP INDEX IF EXISTS idx_incident_reports_requires_legal_consultation;
DROP INDEX IF EXISTS idx_incident_reports_lawyer_consultation_started;

-- Step 7: Drop custom functions
DROP FUNCTION IF EXISTS update_consultation_last_activity();

-- Step 8: Restore data from backup if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '_consultation_posts_backup') THEN
        RAISE NOTICE 'Backup table found. You may want to restore data from _consultation_posts_backup';
        RAISE NOTICE 'Run: INSERT INTO consultation_posts SELECT * FROM _consultation_posts_backup;';
    ELSE
        RAISE NOTICE 'No backup table found.';
    END IF;
END $$;

-- Rollback complete message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== ROLLBACK COMPLETE ===';
    RAISE NOTICE 'All integrated consultation schema changes have been removed.';
    RAISE NOTICE 'The system has been restored to the independent consultation approach.';
    RAISE NOTICE '';
    RAISE NOTICE 'If you had a backup table, consider restoring your data:';
    RAISE NOTICE 'INSERT INTO consultation_posts SELECT * FROM _consultation_posts_backup;';
    RAISE NOTICE 'DROP TABLE _consultation_posts_backup;';
END $$;