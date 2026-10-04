-- Gava Hub / Wihl Verify — PostgreSQL schema
-- Schema: gavahub
-- Compatible with the Node.js backend (DATABASE_URL) and frontend /api/v1 types.

CREATE SCHEMA IF NOT EXISTS gavahub;

-- ---------------------------------------------------------------------------
-- Users & roles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gavahub.app_user (
  id              UUID PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE,
  display_name    TEXT NOT NULL,
  phone_number    TEXT,
  password_hash   TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'ACTIVE'
                    CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DISABLED')),
  account_type    TEXT CHECK (account_type IN ('CANDIDATE', 'EMPLOYER', 'INSTITUTION')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gavahub.user_role (
  user_id         UUID NOT NULL REFERENCES gavahub.app_user (id) ON DELETE CASCADE,
  role            TEXT NOT NULL
                    CHECK (role IN ('ROLE_USER', 'ROLE_ADMIN', 'ROLE_VERIFIER')),
  PRIMARY KEY (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_app_user_email ON gavahub.app_user (email);

-- ---------------------------------------------------------------------------
-- Candidates
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gavahub.candidate_profile (
  id              UUID PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES gavahub.app_user (id) ON DELETE CASCADE,
  given_name      TEXT NOT NULL,
  family_name     TEXT NOT NULL,
  date_of_birth   DATE,
  headline        TEXT,
  profile_status  TEXT NOT NULL DEFAULT 'DRAFT'
                    CHECK (profile_status IN ('DRAFT', 'ACTIVE', 'ARCHIVED')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_candidate_user ON gavahub.candidate_profile (user_id);

-- ---------------------------------------------------------------------------
-- Organizations & members
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gavahub.organization (
  id                UUID PRIMARY KEY,
  legal_name        TEXT NOT NULL,
  trading_name      TEXT,
  organization_type TEXT NOT NULL
                      CHECK (organization_type IN ('EMPLOYER', 'INSTITUTION')),
  status            TEXT NOT NULL DEFAULT 'ACTIVE'
                      CHECK (status IN ('ACTIVE', 'SUSPENDED', 'CLOSED')),
  owner_user_id     UUID REFERENCES gavahub.app_user (id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gavahub.organization_member (
  organization_id   UUID NOT NULL REFERENCES gavahub.organization (id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES gavahub.app_user (id) ON DELETE CASCADE,
  email             TEXT NOT NULL,
  display_name      TEXT NOT NULL,
  member_role       TEXT NOT NULL DEFAULT 'MEMBER'
                      CHECK (member_role IN ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER')),
  status            TEXT NOT NULL DEFAULT 'ACTIVE'
                      CHECK (status IN ('ACTIVE', 'INVITED', 'REMOVED')),
  joined_at         TIMESTAMPTZ,
  PRIMARY KEY (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_member_user ON gavahub.organization_member (user_id);

-- ---------------------------------------------------------------------------
-- Documents
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gavahub.document (
  id                      UUID PRIMARY KEY,
  owner_user_id           UUID REFERENCES gavahub.app_user (id),
  owner_organization_id   UUID REFERENCES gavahub.organization (id),
  original_filename       TEXT NOT NULL,
  content_type            TEXT NOT NULL,
  size_bytes              BIGINT NOT NULL CHECK (size_bytes >= 0),
  malware_scan_status     TEXT NOT NULL DEFAULT 'PENDING'
                            CHECK (malware_scan_status IN ('PENDING', 'CLEAN', 'INFECTED', 'ERROR')),
  storage_path            TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_owner_user ON gavahub.document (owner_user_id);

-- ---------------------------------------------------------------------------
-- Credentials
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gavahub.credential (
  id                        UUID PRIMARY KEY,
  candidate_id              UUID NOT NULL REFERENCES gavahub.candidate_profile (id) ON DELETE CASCADE,
  issuing_organization_id   UUID REFERENCES gavahub.organization (id),
  credential_type           TEXT NOT NULL,
  title                     TEXT NOT NULL,
  credential_number         TEXT,
  issued_on                 DATE,
  expires_on                DATE,
  status                    TEXT NOT NULL DEFAULT 'ACTIVE'
                              CHECK (status IN ('ACTIVE', 'REVOKED', 'EXPIRED')),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credential_candidate ON gavahub.credential (candidate_id);

-- ---------------------------------------------------------------------------
-- Verifications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gavahub.verification (
  id                          UUID PRIMARY KEY,
  reference_number            TEXT NOT NULL UNIQUE,
  candidate_id                UUID NOT NULL REFERENCES gavahub.candidate_profile (id),
  requesting_organization_id  UUID REFERENCES gavahub.organization (id),
  status                      TEXT NOT NULL DEFAULT 'SUBMITTED'
                                CHECK (status IN (
                                  'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'NEEDS_INFO'
                                )),
  purpose                     TEXT NOT NULL,
  submitted_at                TIMESTAMPTZ,
  completed_at                TIMESTAMPTZ,
  created_by_user_id          UUID REFERENCES gavahub.app_user (id),
  decision                    TEXT,
  decision_notes              TEXT,
  decided_by_user_id          UUID REFERENCES gavahub.app_user (id),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_candidate ON gavahub.verification (candidate_id);
CREATE INDEX IF NOT EXISTS idx_verification_status ON gavahub.verification (status);

-- ---------------------------------------------------------------------------
-- Billing & payments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gavahub.invoice (
  id                        UUID PRIMARY KEY,
  invoice_number            TEXT NOT NULL UNIQUE,
  billed_user_id            UUID REFERENCES gavahub.app_user (id),
  billed_organization_id    UUID REFERENCES gavahub.organization (id),
  status                    TEXT NOT NULL DEFAULT 'OPEN'
                              CHECK (status IN ('OPEN', 'PAID', 'VOID', 'OVERDUE')),
  total                     NUMERIC(14, 2) NOT NULL CHECK (total > 0),
  currency                  CHAR(3) NOT NULL DEFAULT 'KES',
  due_at                    TIMESTAMPTZ,
  paid_at                   TIMESTAMPTZ,
  description               TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoice_user ON gavahub.invoice (billed_user_id);

CREATE TABLE IF NOT EXISTS gavahub.payment (
  id                UUID PRIMARY KEY,
  invoice_id        UUID NOT NULL REFERENCES gavahub.invoice (id),
  user_id           UUID REFERENCES gavahub.app_user (id),
  amount            NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  currency          CHAR(3) NOT NULL DEFAULT 'KES',
  status            TEXT NOT NULL DEFAULT 'PENDING'
                      CHECK (status IN (
                        'PENDING', 'AWAITING_PAYBILL', 'PENDING_CONFIRMATION',
                        'SUCCEEDED', 'FAILED', 'CANCELLED'
                      )),
  failure_reason    TEXT,
  phone_number      TEXT,
  provider          TEXT NOT NULL DEFAULT 'COOP_PAYBILL',
  provider_ref      TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_invoice ON gavahub.payment (invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_user ON gavahub.payment (user_id);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gavahub.notification (
  id                  UUID PRIMARY KEY,
  recipient_user_id   UUID NOT NULL REFERENCES gavahub.app_user (id) ON DELETE CASCADE,
  channel             TEXT NOT NULL CHECK (channel IN ('EMAIL', 'SMS', 'IN_APP')),
  template_code       TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'QUEUED'
                        CHECK (status IN ('QUEUED', 'SENDING', 'SENT', 'FAILED')),
  attempt_count       INT NOT NULL DEFAULT 0,
  payload             JSONB NOT NULL DEFAULT '{}'::jsonb,
  sent_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_user ON gavahub.notification (recipient_user_id);

-- ---------------------------------------------------------------------------
-- Audit
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gavahub.audit_event (
  id                      UUID PRIMARY KEY,
  actor_user_id           UUID REFERENCES gavahub.app_user (id),
  actor_organization_id   UUID REFERENCES gavahub.organization (id),
  action                  TEXT NOT NULL,
  resource_type           TEXT NOT NULL,
  resource_id             TEXT,
  outcome                 TEXT NOT NULL DEFAULT 'SUCCESS'
                            CHECK (outcome IN ('SUCCESS', 'FAILURE', 'DENIED')),
  request_id              TEXT,
  event_data              JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_occurred ON gavahub.audit_event (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON gavahub.audit_event (action);

-- ---------------------------------------------------------------------------
-- Contact enquiries (public form)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gavahub.contact_enquiry (
  id                  UUID PRIMARY KEY,
  reference_number    TEXT NOT NULL UNIQUE,
  full_name           TEXT NOT NULL,
  email               TEXT NOT NULL,
  phone_number        TEXT,
  requester_type      TEXT NOT NULL
                        CHECK (requester_type IN ('CANDIDATE', 'EMPLOYER', 'INSTITUTION', 'OTHER')),
  message             TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'NEW'
                        CHECK (status IN ('NEW', 'IN_PROGRESS', 'CLOSED')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_created ON gavahub.contact_enquiry (created_at DESC);
