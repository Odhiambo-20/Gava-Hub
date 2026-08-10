CREATE TABLE gavahub.notification (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_user_id uuid REFERENCES gavahub.app_user(id) ON DELETE RESTRICT,
    channel varchar(20) NOT NULL CHECK (channel IN ('EMAIL', 'SMS', 'IN_APP')),
    template_code varchar(100) NOT NULL,
    destination_ciphertext bytea,
    template_data jsonb NOT NULL DEFAULT '{}'::jsonb,
    status varchar(30) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'PROCESSING', 'SENT', 'DELIVERED', 'FAILED', 'CANCELLED')),
    attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    next_attempt_at timestamptz,
    provider_reference varchar(150),
    last_error text,
    sent_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TRIGGER notification_set_updated_at
BEFORE UPDATE ON gavahub.notification
FOR EACH ROW EXECUTE FUNCTION gavahub.set_updated_at();

CREATE TABLE gavahub.outbox_event (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type varchar(100) NOT NULL,
    aggregate_id uuid NOT NULL,
    event_type varchar(150) NOT NULL,
    payload jsonb NOT NULL,
    occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    published_at timestamptz,
    attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    next_attempt_at timestamptz,
    last_error text
);

CREATE TABLE gavahub.audit_event (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id uuid REFERENCES gavahub.app_user(id) ON DELETE SET NULL,
    actor_organization_id uuid REFERENCES gavahub.organization(id) ON DELETE SET NULL,
    action varchar(150) NOT NULL,
    resource_type varchar(100) NOT NULL,
    resource_id varchar(150),
    outcome varchar(20) NOT NULL CHECK (outcome IN ('SUCCESS', 'DENIED', 'FAILURE')),
    request_id varchar(100),
    ip_address inet,
    user_agent text,
    event_data jsonb NOT NULL DEFAULT '{}'::jsonb,
    occurred_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE gavahub.document_access_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id uuid NOT NULL REFERENCES gavahub.document(id) ON DELETE RESTRICT,
    actor_user_id uuid REFERENCES gavahub.app_user(id) ON DELETE SET NULL,
    actor_organization_id uuid REFERENCES gavahub.organization(id) ON DELETE SET NULL,
    access_type varchar(30) NOT NULL CHECK (access_type IN ('VIEW', 'DOWNLOAD', 'UPLOAD', 'DELETE')),
    purpose text,
    request_id varchar(100),
    ip_address inet,
    occurred_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE OR REPLACE FUNCTION gavahub.reject_immutable_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'table %.% is append-only', TG_TABLE_SCHEMA, TG_TABLE_NAME;
END;
$$;

CREATE TRIGGER audit_event_immutable
BEFORE UPDATE OR DELETE ON gavahub.audit_event
FOR EACH ROW EXECUTE FUNCTION gavahub.reject_immutable_change();

CREATE TRIGGER document_access_log_immutable
BEFORE UPDATE OR DELETE ON gavahub.document_access_log
FOR EACH ROW EXECUTE FUNCTION gavahub.reject_immutable_change();

CREATE TRIGGER verification_event_immutable
BEFORE UPDATE OR DELETE ON gavahub.verification_event
FOR EACH ROW EXECUTE FUNCTION gavahub.reject_immutable_change();

CREATE INDEX notification_delivery_idx ON gavahub.notification(status, next_attempt_at);
CREATE INDEX outbox_unpublished_idx ON gavahub.outbox_event(occurred_at) WHERE published_at IS NULL;
CREATE INDEX audit_actor_time_idx ON gavahub.audit_event(actor_user_id, occurred_at DESC);
CREATE INDEX audit_resource_time_idx ON gavahub.audit_event(resource_type, resource_id, occurred_at DESC);
CREATE INDEX audit_request_idx ON gavahub.audit_event(request_id);
CREATE INDEX document_access_document_time_idx ON gavahub.document_access_log(document_id, occurred_at DESC);
