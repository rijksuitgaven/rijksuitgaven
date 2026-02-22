-- 071: Email preferences — topic-based email management
-- 2 new tables: email_topics, email_preferences
-- FKs on campaigns + email_sequences for topic linking

-- Admin-managed email topics
CREATE TABLE email_topics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT,
  is_default  BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Per-person topic preferences
CREATE TABLE email_preferences (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id   UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  topic_id    UUID NOT NULL REFERENCES email_topics(id) ON DELETE CASCADE,
  subscribed  BOOLEAN NOT NULL DEFAULT true,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (person_id, topic_id)
);
CREATE INDEX idx_ep_person ON email_preferences (person_id);

-- Link campaigns + sequences to topics
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES email_topics(id) ON DELETE SET NULL;
ALTER TABLE email_sequences ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES email_topics(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE email_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;

-- Seed initial topics
INSERT INTO email_topics (slug, name, description, is_default, sort_order) VALUES
  ('campagnes', 'Campagne e-mails', 'Periodieke nieuwsbrieven en updates over rijksuitgaven', true, 1),
  ('onboarding', 'Welkom e-mails', 'Introductie-e-mails na aanmelding', true, 2),
  ('product', 'Productupdates', 'Nieuwe functies en verbeteringen', true, 3);
