-- Migration: Migrate data from independent consultation_posts to integrated system
-- Date: 2025-09-26
-- Purpose: Safely migrate existing consultation data to the new integrated approach

-- IMPORTANT: This migration should be run carefully in production
-- Always backup data before running this migration!

-- Step 1: Create temporary backup table (safety measure)
CREATE TABLE IF NOT EXISTS public._consultation_posts_backup AS
SELECT * FROM public.consultation_posts;

-- Step 2: Migrate consultation_posts data to lawyer_consultations
-- Only migrate consultations that are linked to reports (related_report_id is not null)
INSERT INTO public.lawyer_consultations (
    report_id,
    lawyer_id,
    assigned_by,
    consultation_content,
    status,
    consultation_type,
    started_at,
    completed_at,
    client_rating,
    client_feedback,
    created_at,
    updated_at
)
SELECT
    cp.related_report_id as report_id,
    cp.lawyer_id,
    NULL as assigned_by, -- Will need to be updated manually if needed
    cp.content as consultation_content,
    CASE
        WHEN cp.status = 'pending' THEN 'pending'::lawyer_consultation_status
        WHEN cp.status = 'assigned' THEN 'in_progress'::lawyer_consultation_status
        WHEN cp.status = 'in_progress' THEN 'in_progress'::lawyer_consultation_status
        WHEN cp.status = 'completed' THEN 'completed'::lawyer_consultation_status
        ELSE 'pending'::lawyer_consultation_status
    END as status,
    CASE
        WHEN cp.consultation_type = 'general' THEN 'general'
        WHEN cp.consultation_type = 'legal_review' THEN 'legal_review'
        WHEN cp.consultation_type = 'document_review' THEN 'document_review'
        ELSE 'general'
    END as consultation_type,
    cp.scheduled_at as started_at,
    cp.completed_at,
    cp.rating as client_rating,
    cp.feedback as client_feedback,
    cp.created_at,
    cp.updated_at
FROM public.consultation_posts cp
WHERE cp.related_report_id IS NOT NULL
ON CONFLICT DO NOTHING; -- Prevent duplicates if migration is run multiple times

-- Step 3: Update incident_reports with lawyer assignment data
-- This links reports with their consultation data
UPDATE public.incident_reports ir
SET
    assigned_lawyer_id = cp.lawyer_id,
    assigned_at = cp.created_at,
    lawyer_consultation_started_at = cp.scheduled_at,
    lawyer_response_at = cp.completed_at,
    requires_legal_consultation = true
FROM public.consultation_posts cp
WHERE ir.id = cp.related_report_id
  AND cp.lawyer_id IS NOT NULL;

-- Step 4: Migrate consultation_comments to a new structure
-- Create a table for consultation discussion if it doesn't exist
CREATE TABLE IF NOT EXISTS public.lawyer_consultation_discussions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    consultation_id uuid NOT NULL REFERENCES public.lawyer_consultations(id) ON DELETE CASCADE,
    author_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    content text NOT NULL,
    is_internal_note boolean DEFAULT false,
    attachments jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Migrate consultation comments
INSERT INTO public.lawyer_consultation_discussions (
    consultation_id,
    author_id,
    content,
    is_internal_note,
    attachments,
    created_at,
    updated_at
)
SELECT
    lc.id as consultation_id,
    cc.author_id,
    cc.content,
    cc.is_private as is_internal_note,
    cc.attachments,
    cc.created_at,
    cc.updated_at
FROM public.consultation_comments cc
JOIN public.consultation_posts cp ON cc.consultation_id = cp.id
JOIN public.lawyer_consultations lc ON lc.report_id = cp.related_report_id
WHERE cp.related_report_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Step 5: Add indexes for the new discussion table
CREATE INDEX IF NOT EXISTS idx_lawyer_consultation_discussions_consultation_id
ON public.lawyer_consultation_discussions(consultation_id);

CREATE INDEX IF NOT EXISTS idx_lawyer_consultation_discussions_author_id
ON public.lawyer_consultation_discussions(author_id);

-- Step 6: Add updated_at trigger for the new table
CREATE TRIGGER update_lawyer_consultation_discussions_updated_at
BEFORE UPDATE ON public.lawyer_consultation_discussions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Create a view for easy access to consultation data
CREATE OR REPLACE VIEW public.consultation_overview AS
SELECT
    ir.id as report_id,
    ir.title as report_title,
    ir.status as report_status,
    ir.assigned_lawyer_id,
    ir.requires_legal_consultation,
    up_reporter.name as reporter_name,
    up_lawyer.name as lawyer_name,
    lc.id as consultation_id,
    lc.status as consultation_status,
    lc.consultation_content,
    lc.recommended_actions,
    lc.priority_level,
    lc.consultation_type,
    lc.client_rating,
    lc.created_at as consultation_created_at,
    lc.completed_at as consultation_completed_at
FROM public.incident_reports ir
LEFT JOIN public.lawyer_consultations lc ON ir.id = lc.report_id
LEFT JOIN public.user_profiles up_reporter ON ir.reporter_id = up_reporter.id
LEFT JOIN public.user_profiles up_lawyer ON ir.assigned_lawyer_id = up_lawyer.id
WHERE ir.requires_legal_consultation = true
ORDER BY ir.created_at DESC;

-- Add comments
COMMENT ON VIEW public.consultation_overview
IS 'Comprehensive view of reports with their lawyer consultations';

COMMENT ON TABLE public.lawyer_consultation_discussions
IS 'Discussion threads for lawyer consultations';

-- Migration complete message
DO $$
BEGIN
    RAISE NOTICE 'Data migration completed successfully!';
    RAISE NOTICE 'Please verify the migrated data and update assigned_by fields as needed.';
    RAISE NOTICE 'Backup table _consultation_posts_backup created for safety.';
END $$;