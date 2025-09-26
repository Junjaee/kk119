-- Migration: Add lawyer consultation fields to incident_reports table
-- Date: 2025-09-26
-- Purpose: Extend incident_reports table to support integrated lawyer consultation system

-- Add consultation status enum values to existing incident_status
-- Note: incident_status already exists, we may need to add more values if needed

-- Add new columns to incident_reports table
ALTER TABLE public.incident_reports
ADD COLUMN IF NOT EXISTS lawyer_consultation_started_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS lawyer_response_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS consultation_priority integer DEFAULT 1 CHECK (consultation_priority BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS requires_legal_consultation boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS consultation_notes text,
ADD COLUMN IF NOT EXISTS assigned_by uuid REFERENCES public.user_profiles(id);

-- Add indexes for the new consultation fields
CREATE INDEX IF NOT EXISTS idx_incident_reports_consultation_priority
ON public.incident_reports(consultation_priority);

CREATE INDEX IF NOT EXISTS idx_incident_reports_requires_legal_consultation
ON public.incident_reports(requires_legal_consultation);

CREATE INDEX IF NOT EXISTS idx_incident_reports_lawyer_consultation_started
ON public.incident_reports(lawyer_consultation_started_at);

-- Add comments to document the new fields
COMMENT ON COLUMN public.incident_reports.lawyer_consultation_started_at
IS 'Timestamp when lawyer consultation was started';

COMMENT ON COLUMN public.incident_reports.lawyer_response_at
IS 'Timestamp when lawyer provided the consultation response';

COMMENT ON COLUMN public.incident_reports.consultation_priority
IS 'Priority level for legal consultation (1-5, 5 being highest)';

COMMENT ON COLUMN public.incident_reports.requires_legal_consultation
IS 'Boolean flag indicating if this report requires legal consultation';

COMMENT ON COLUMN public.incident_reports.consultation_notes
IS 'Internal notes about the consultation process';

COMMENT ON COLUMN public.incident_reports.assigned_by
IS 'ID of admin user who assigned the lawyer to this case';