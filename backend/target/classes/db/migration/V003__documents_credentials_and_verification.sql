CREATE TABLE gavahub.document (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id uuid REFERENCES gavahub.app_user(id) ON DELETE RESTRICT,
    owner_organization_id uuid REFERENCES gavahub.organization(id) ON DELETE RESTRICT,
    storage_provider varchar(40) NOT NULL,
    storage_bucket varchar(255) NOT NULL,
    storage_key text NOT NULL UNIQUE,
    original_filename varchar(255) NOT NULL,
    content_type varchar(150) NOT NULL,
    size_bytes bigint NOT NULL CHECK (size_bytes > 0),
    sha256_hash char(64) NOT NULL,
    malware_scan_status varchar(30) NOT NULL DEFAULT 'PENDING'
        CHECK (malware_scan_status IN ('PENDING', 'CLEAN', 'INFECTED', 'FAILED')),
    retention_until timestamptz,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    deleted_at timestamptz,
    CHECK (owner_user_id IS NOT NULL OR owner_organization_id IS NOT NULL)
);

CREATE TABLE gavahub.credential (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id uuid NOT NULL REFERENCES gavahub.candidate_profile(id) ON DELETE RESTRICT,
    issuing_organization_id uuid REFERENCES gavahub.organization(id) ON DELETE RESTRICT,
    document_id uuid REFERENCES gavahub.document(id) ON DELETE RESTRICT,
    credential_type varchar(50) NOT NULL,
    title varchar(255) NOT NULL,
    field_of_study varchar(255),
    credential_number varchar(150),
    issued_on date,
    expires_on date,
    status varchar(30) NOT NULL DEFAULT 'UNVERIFIED'
        CHECK (status IN ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED', 'REVOKED')),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    CHECK (expires_on IS NULL OR issued_on IS NULL OR expires_on >= issued_on)
);

CREATE TRIGGER credential_set_updated_at
BEFORE UPDATE ON gavahub.credential
FOR EACH ROW EXECUTE FUNCTION gavahub.set_updated_at();

CREATE TABLE gavahub.consent (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id uuid NOT NULL REFERENCES gavahub.candidate_profile(id) ON DELETE RESTRICT,
    granted_to_organization_id uuid NOT NULL REFERENCES gavahub.organization(id) ON DELETE RESTRICT,
    purpose varchar(255) NOT NULL,
    scope jsonb NOT NULL,
    status varchar(30) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'REVOKED', 'EXPIRED')),
    granted_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    expires_at timestamptz,
    revoked_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    CHECK (expires_at IS NULL OR expires_at > granted_at),
    CHECK ((status <> 'REVOKED') OR revoked_at IS NOT NULL)
);

CREATE TABLE gavahub.verification_request (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number varchar(40) NOT NULL UNIQUE,
    requested_by_user_id uuid NOT NULL REFERENCES gavahub.app_user(id) ON DELETE RESTRICT,
    requesting_organization_id uuid REFERENCES gavahub.organization(id) ON DELETE RESTRICT,
    candidate_id uuid NOT NULL REFERENCES gavahub.candidate_profile(id) ON DELETE RESTRICT,
    consent_id uuid NOT NULL REFERENCES gavahub.consent(id) ON DELETE RESTRICT,
    status varchar(30) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'AWAITING_PAYMENT', 'SUBMITTED', 'IN_REVIEW', 'COMPLETED', 'REJECTED', 'CANCELLED', 'EXPIRED')),
    purpose varchar(255) NOT NULL,
    submitted_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TRIGGER verification_request_set_updated_at
BEFORE UPDATE ON gavahub.verification_request
FOR EACH ROW EXECUTE FUNCTION gavahub.set_updated_at();

CREATE TABLE gavahub.verification_item (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_request_id uuid NOT NULL REFERENCES gavahub.verification_request(id) ON DELETE CASCADE,
    credential_id uuid NOT NULL REFERENCES gavahub.credential(id) ON DELETE RESTRICT,
    assigned_organization_id uuid REFERENCES gavahub.organization(id) ON DELETE RESTRICT,
    status varchar(30) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'IN_REVIEW', 'VERIFIED', 'REJECTED', 'MORE_INFORMATION_REQUIRED', 'CANCELLED')),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    UNIQUE (verification_request_id, credential_id)
);

CREATE TRIGGER verification_item_set_updated_at
BEFORE UPDATE ON gavahub.verification_item
FOR EACH ROW EXECUTE FUNCTION gavahub.set_updated_at();

CREATE TABLE gavahub.verification_decision (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_item_id uuid NOT NULL REFERENCES gavahub.verification_item(id) ON DELETE RESTRICT,
    decided_by_user_id uuid NOT NULL REFERENCES gavahub.app_user(id) ON DELETE RESTRICT,
    decision varchar(30) NOT NULL
        CHECK (decision IN ('VERIFIED', 'REJECTED', 'MORE_INFORMATION_REQUIRED')),
    reason_code varchar(80),
    notes text,
    evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
    decided_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE gavahub.verification_event (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_request_id uuid NOT NULL REFERENCES gavahub.verification_request(id) ON DELETE RESTRICT,
    actor_user_id uuid REFERENCES gavahub.app_user(id) ON DELETE SET NULL,
    event_type varchar(80) NOT NULL,
    event_data jsonb NOT NULL DEFAULT '{}'::jsonb,
    occurred_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX document_owner_user_idx ON gavahub.document(owner_user_id) WHERE deleted_at IS NULL;
CREATE INDEX document_sha256_idx ON gavahub.document(sha256_hash);
CREATE INDEX credential_candidate_status_idx ON gavahub.credential(candidate_id, status);
CREATE INDEX credential_issuer_idx ON gavahub.credential(issuing_organization_id);
CREATE INDEX consent_candidate_status_idx ON gavahub.consent(candidate_id, status);
CREATE INDEX verification_request_candidate_idx ON gavahub.verification_request(candidate_id, status);
CREATE INDEX verification_request_org_idx ON gavahub.verification_request(requesting_organization_id, status);
CREATE INDEX verification_item_assignee_idx ON gavahub.verification_item(assigned_organization_id, status);
CREATE INDEX verification_event_request_time_idx ON gavahub.verification_event(verification_request_id, occurred_at);
