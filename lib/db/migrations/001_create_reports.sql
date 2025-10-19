-- @CODE:REPORT-DB-001 | Chain: SPEC-REPORT-001 -> CODE-REPORT-001
-- Migration: Create reports and report_status_history tables

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_number TEXT UNIQUE NOT NULL,           -- RPT-YYYYMMDD-XXXX
  teacher_id INTEGER NOT NULL,                  -- FOREIGN KEY: users.id
  category TEXT NOT NULL,                       -- enum: 학부모 민원, 학생 폭력, 명예훼손
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  incident_date DATE NOT NULL,
  location TEXT NOT NULL,
  witness_count INTEGER,
  is_emergency BOOLEAN DEFAULT 0,
  status TEXT DEFAULT 'received',               -- enum: received, reviewing, consulting, completed
  lawyer_id INTEGER,                            -- FOREIGN KEY: users.id (assigned lawyer)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,

  FOREIGN KEY (teacher_id) REFERENCES users(id),
  FOREIGN KEY (lawyer_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_teacher ON reports(teacher_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_number ON reports(report_number);

-- Status change history table
CREATE TABLE IF NOT EXISTS report_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id INTEGER NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by INTEGER NOT NULL,                  -- FOREIGN KEY: users.id
  changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  note TEXT,

  FOREIGN KEY (report_id) REFERENCES reports(id),
  FOREIGN KEY (changed_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_report_history_report ON report_status_history(report_id);
CREATE INDEX IF NOT EXISTS idx_report_history_changed_at ON report_status_history(changed_at);
