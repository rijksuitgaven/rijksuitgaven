-- 069: Email sequences — automated multi-step email flows
-- 4 new tables: sequences, steps, enrollments, sends

-- Sequence definitions
CREATE TABLE email_sequences (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'paused')),
  send_time   TIME NOT NULL DEFAULT '09:00',
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sequence steps (individual emails)
CREATE TABLE email_sequence_steps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
  step_order  INTEGER NOT NULL,
  delay_days  INTEGER NOT NULL DEFAULT 0,
  subject     TEXT NOT NULL,
  heading     TEXT NOT NULL,
  preheader   TEXT,
  body        TEXT NOT NULL,
  cta_text    TEXT,
  cta_url     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sequence_id, step_order)
);

-- Per-person enrollment
CREATE TABLE email_sequence_enrollments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id     UUID NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
  person_id       UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  current_step    INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  enrolled_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  UNIQUE (sequence_id, person_id)
);

-- Send log (dedup + tracking)
CREATE TABLE email_sequence_sends (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id   UUID NOT NULL REFERENCES email_sequence_enrollments(id) ON DELETE CASCADE,
  step_id         UUID NOT NULL REFERENCES email_sequence_steps(id) ON DELETE CASCADE,
  person_id       UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  resend_email_id TEXT,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  status          TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  error_message   TEXT,
  UNIQUE (enrollment_id, step_id)
);

-- Indexes
CREATE INDEX idx_es_status ON email_sequences (status);
CREATE INDEX idx_ess_sequence ON email_sequence_steps (sequence_id, step_order);
CREATE INDEX idx_ese_active ON email_sequence_enrollments (sequence_id, status) WHERE status = 'active';
CREATE INDEX idx_ese_person ON email_sequence_enrollments (person_id);
CREATE INDEX idx_esends_step ON email_sequence_sends (step_id);
CREATE INDEX idx_esends_person ON email_sequence_sends (person_id);

-- RLS (admin only, service role bypasses)
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequence_sends ENABLE ROW LEVEL SECURITY;
