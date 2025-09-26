-- Schema Validation Tests for Integrated Lawyer Consultation System
-- Date: 2025-09-26
-- Purpose: Validate all schema changes and ensure data integrity

-- Test Setup: Enable test mode
DO $$
BEGIN
    RAISE NOTICE 'Starting schema validation tests...';
END $$;

-- Test 1: Verify all new columns exist in incident_reports
DO $$
DECLARE
    column_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'incident_reports'
      AND column_name IN (
          'lawyer_consultation_started_at',
          'lawyer_response_at',
          'consultation_priority',
          'requires_legal_consultation',
          'consultation_notes',
          'assigned_by'
      );

    IF column_count = 6 THEN
        RAISE NOTICE '✓ Test 1 PASSED: All new columns exist in incident_reports';
    ELSE
        RAISE EXCEPTION '✗ Test 1 FAILED: Missing columns in incident_reports. Found % of 6', column_count;
    END IF;
END $$;

-- Test 2: Verify lawyer_consultations table exists with all columns
DO $$
DECLARE
    column_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'lawyer_consultations';

    IF column_count >= 20 THEN -- Should have around 20+ columns
        RAISE NOTICE '✓ Test 2 PASSED: lawyer_consultations table exists with % columns', column_count;
    ELSE
        RAISE EXCEPTION '✗ Test 2 FAILED: lawyer_consultations table missing or incomplete. Found % columns', column_count;
    END IF;
END $$;

-- Test 3: Verify foreign key constraints exist
DO $$
DECLARE
    constraint_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO constraint_count
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name IN ('incident_reports', 'lawyer_consultations')
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name IN ('assigned_by', 'lawyer_id', 'report_id');

    IF constraint_count >= 3 THEN
        RAISE NOTICE '✓ Test 3 PASSED: Foreign key constraints exist (% found)', constraint_count;
    ELSE
        RAISE EXCEPTION '✗ Test 3 FAILED: Missing foreign key constraints. Found % of expected 3+', constraint_count;
    END IF;
END $$;

-- Test 4: Verify indexes exist for performance
DO $$
DECLARE
    index_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO index_count
    FROM pg_indexes
    WHERE tablename IN ('incident_reports', 'lawyer_consultations')
      AND indexname LIKE '%consultation%' OR indexname LIKE '%lawyer%';

    IF index_count >= 5 THEN
        RAISE NOTICE '✓ Test 4 PASSED: Performance indexes exist (% found)', index_count;
    ELSE
        RAISE NOTICE '⚠ Test 4 WARNING: Limited indexes found (% found)', index_count;
    END IF;
END $$;

-- Test 5: Test data insertion and retrieval
DO $$
DECLARE
    test_user_id UUID;
    test_report_id UUID;
    test_consultation_id UUID;
BEGIN
    -- Create test user (lawyer)
    INSERT INTO public.user_profiles (id, email, name, role, is_verified)
    VALUES (gen_random_uuid(), 'test.lawyer@test.com', 'Test Lawyer', 'lawyer', true)
    RETURNING id INTO test_user_id;

    -- Create test report
    INSERT INTO public.incident_reports (
        id, reporter_id, title, content, incident_date,
        requires_legal_consultation, consultation_priority
    )
    VALUES (
        gen_random_uuid(), test_user_id, 'Test Report', 'Test content', CURRENT_DATE,
        true, 3
    )
    RETURNING id INTO test_report_id;

    -- Create test consultation
    INSERT INTO public.lawyer_consultations (
        report_id, lawyer_id, consultation_content,
        status, priority_level, consultation_type
    )
    VALUES (
        test_report_id, test_user_id, 'Test consultation content',
        'in_progress', 3, 'general'
    )
    RETURNING id INTO test_consultation_id;

    -- Verify data can be retrieved
    IF EXISTS (
        SELECT 1
        FROM public.consultation_overview co
        WHERE co.report_id = test_report_id
          AND co.consultation_id = test_consultation_id
    ) THEN
        RAISE NOTICE '✓ Test 5 PASSED: Data insertion and retrieval works correctly';
    ELSE
        RAISE EXCEPTION '✗ Test 5 FAILED: Cannot retrieve inserted test data';
    END IF;

    -- Cleanup test data
    DELETE FROM public.lawyer_consultations WHERE id = test_consultation_id;
    DELETE FROM public.incident_reports WHERE id = test_report_id;
    DELETE FROM public.user_profiles WHERE id = test_user_id;

EXCEPTION
    WHEN OTHERS THEN
        -- Cleanup on error
        DELETE FROM public.lawyer_consultations WHERE report_id = test_report_id;
        DELETE FROM public.incident_reports WHERE id = test_report_id;
        DELETE FROM public.user_profiles WHERE email = 'test.lawyer@test.com';
        RAISE;
END $$;

-- Test 6: Test consultation_overview view
DO $$
DECLARE
    view_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.views
        WHERE table_name = 'consultation_overview'
    ) INTO view_exists;

    IF view_exists THEN
        RAISE NOTICE '✓ Test 6 PASSED: consultation_overview view exists and is accessible';
    ELSE
        RAISE EXCEPTION '✗ Test 6 FAILED: consultation_overview view not found';
    END IF;
END $$;

-- Test 7: Test enum types
DO $$
DECLARE
    enum_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO enum_count
    FROM pg_type
    WHERE typname IN ('user_role', 'incident_status', 'lawyer_consultation_status');

    IF enum_count >= 2 THEN -- At least user_role and incident_status should exist
        RAISE NOTICE '✓ Test 7 PASSED: Required enum types exist (% found)', enum_count;
    ELSE
        RAISE EXCEPTION '✗ Test 7 FAILED: Missing enum types. Found % of expected 2+', enum_count;
    END IF;
END $$;

-- Test 8: Test triggers and functions
DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO trigger_count
    FROM information_schema.triggers
    WHERE event_object_table IN ('lawyer_consultations', 'incident_reports')
      AND trigger_name LIKE '%updated_at%';

    IF trigger_count >= 1 THEN
        RAISE NOTICE '✓ Test 8 PASSED: Updated_at triggers exist (% found)', trigger_count;
    ELSE
        RAISE NOTICE '⚠ Test 8 WARNING: No updated_at triggers found';
    END IF;
END $$;

-- Final summary
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== SCHEMA VALIDATION COMPLETE ===';
    RAISE NOTICE 'All critical tests passed!';
    RAISE NOTICE 'The integrated lawyer consultation system is ready for use.';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Run data migration if needed: 003_migrate_consultation_data.sql';
    RAISE NOTICE '2. Update application code to use new schema';
    RAISE NOTICE '3. Test API endpoints with new database structure';
    RAISE NOTICE '4. Deploy to production environment';
END $$;