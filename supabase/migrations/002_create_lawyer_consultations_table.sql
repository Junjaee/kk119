-- Migration: Create lawyer_consultations table for integrated consultation system
-- Date: 2025-09-26
-- Purpose: Create a dedicated table for lawyer consultations linked to incident reports

-- Create consultation_status enum for the new table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lawyer_consultation_status') THEN
        CREATE TYPE lawyer_consultation_status AS ENUM (
            'pending',
            'in_progress',
            'completed',
            'closed',
            'on_hold'
        );
    END IF;
END $$;

-- Create lawyer_consultations table for the integrated system
CREATE TABLE IF NOT EXISTS public.lawyer_consultations (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,

    -- Core relationships
    report_id uuid NOT NULL REFERENCES public.incident_reports(id) ON DELETE CASCADE,
    lawyer_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    assigned_by uuid REFERENCES public.user_profiles(id), -- Admin who assigned

    -- Consultation content
    consultation_content text NOT NULL,
    recommended_actions text,
    legal_basis text,
    additional_notes text,

    -- Status and priority
    status lawyer_consultation_status DEFAULT 'pending',
    priority_level integer DEFAULT 1 CHECK (priority_level BETWEEN 1 AND 5),

    -- Consultation type and metadata
    consultation_type varchar(50) DEFAULT 'general', -- general, legal_review, document_review, emergency
    estimated_hours decimal(4,2), -- Estimated consultation time
    actual_hours decimal(4,2), -- Actual time spent

    -- Timeline tracking
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    last_activity_at timestamp with time zone DEFAULT now(),

    -- Client feedback
    client_rating integer CHECK (client_rating BETWEEN 1 AND 5),
    client_feedback text,

    -- Internal tracking
    billable_hours decimal(4,2),
    internal_notes text, -- Private notes for lawyers/admins

    -- Standard timestamps
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),

    -- Constraints
    CONSTRAINT unique_active_consultation_per_report
        UNIQUE(report_id, lawyer_id)
        WHERE status IN ('pending', 'in_progress', 'on_hold')
);

-- Create indexes for the lawyer_consultations table
CREATE INDEX IF NOT EXISTS idx_lawyer_consultations_report_id
ON public.lawyer_consultations(report_id);

CREATE INDEX IF NOT EXISTS idx_lawyer_consultations_lawyer_id
ON public.lawyer_consultations(lawyer_id);

CREATE INDEX IF NOT EXISTS idx_lawyer_consultations_status
ON public.lawyer_consultations(status);

CREATE INDEX IF NOT EXISTS idx_lawyer_consultations_created_at
ON public.lawyer_consultations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lawyer_consultations_priority
ON public.lawyer_consultations(priority_level DESC);

CREATE INDEX IF NOT EXISTS idx_lawyer_consultations_type
ON public.lawyer_consultations(consultation_type);

-- Add updated_at trigger
CREATE TRIGGER update_lawyer_consultations_updated_at
BEFORE UPDATE ON public.lawyer_consultations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to update last_activity_at on any change
CREATE OR REPLACE FUNCTION update_consultation_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_activity_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_consultation_last_activity_trigger
BEFORE UPDATE ON public.lawyer_consultations
FOR EACH ROW EXECUTE FUNCTION update_consultation_last_activity();

-- Add comments for documentation
COMMENT ON TABLE public.lawyer_consultations
IS 'Lawyer consultations integrated with incident reports system';

COMMENT ON COLUMN public.lawyer_consultations.consultation_content
IS 'Main consultation content and advice provided by the lawyer';

COMMENT ON COLUMN public.lawyer_consultations.recommended_actions
IS 'Specific actions recommended by the lawyer';

COMMENT ON COLUMN public.lawyer_consultations.legal_basis
IS 'Legal basis and references for the consultation';

COMMENT ON COLUMN public.lawyer_consultations.priority_level
IS 'Consultation priority level (1-5, 5 being highest)';

COMMENT ON COLUMN public.lawyer_consultations.consultation_type
IS 'Type of consultation: general, legal_review, document_review, emergency';

COMMENT ON COLUMN public.lawyer_consultations.estimated_hours
IS 'Estimated time to complete consultation';

COMMENT ON COLUMN public.lawyer_consultations.actual_hours
IS 'Actual time spent on consultation';

COMMENT ON COLUMN public.lawyer_consultations.billable_hours
IS 'Billable hours for this consultation';

COMMENT ON COLUMN public.lawyer_consultations.internal_notes
IS 'Private notes visible only to lawyers and admins';