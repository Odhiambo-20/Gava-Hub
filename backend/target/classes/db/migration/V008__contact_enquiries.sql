CREATE TABLE gavahub.contact_enquiry (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number varchar(40) NOT NULL UNIQUE,
    full_name varchar(200) NOT NULL,
    email citext NOT NULL,
    phone_e164 varchar(20),
    requester_type varchar(30) NOT NULL
        CHECK (requester_type IN ('CANDIDATE', 'EMPLOYER', 'INSTITUTION', 'OTHER')),
    message text NOT NULL,
    status varchar(30) NOT NULL DEFAULT 'NEW'
        CHECK (status IN ('NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TRIGGER contact_enquiry_set_updated_at
BEFORE UPDATE ON gavahub.contact_enquiry
FOR EACH ROW EXECUTE FUNCTION gavahub.set_updated_at();

CREATE INDEX contact_enquiry_status_created_idx
    ON gavahub.contact_enquiry(status, created_at DESC);
