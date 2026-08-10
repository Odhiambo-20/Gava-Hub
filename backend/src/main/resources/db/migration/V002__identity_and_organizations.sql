CREATE TABLE gavahub.app_user (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    external_subject varchar(255) UNIQUE,
    email citext NOT NULL UNIQUE,
    phone_e164 varchar(20) UNIQUE,
    display_name varchar(200) NOT NULL,
    status varchar(30) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'DISABLED')),
    email_verified boolean NOT NULL DEFAULT false,
    phone_verified boolean NOT NULL DEFAULT false,
    last_login_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TRIGGER app_user_set_updated_at
BEFORE UPDATE ON gavahub.app_user
FOR EACH ROW EXECUTE FUNCTION gavahub.set_updated_at();

CREATE TABLE gavahub.role (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(80) NOT NULL UNIQUE,
    name varchar(120) NOT NULL,
    description text,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE gavahub.permission (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(120) NOT NULL UNIQUE,
    description text,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE gavahub.role_permission (
    role_id uuid NOT NULL REFERENCES gavahub.role(id) ON DELETE CASCADE,
    permission_id uuid NOT NULL REFERENCES gavahub.permission(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE gavahub.user_role (
    user_id uuid NOT NULL REFERENCES gavahub.app_user(id) ON DELETE CASCADE,
    role_id uuid NOT NULL REFERENCES gavahub.role(id) ON DELETE CASCADE,
    granted_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    granted_by uuid REFERENCES gavahub.app_user(id) ON DELETE SET NULL,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE gavahub.organization (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    legal_name varchar(255) NOT NULL,
    trading_name varchar(255),
    registration_number varchar(100),
    organization_type varchar(40) NOT NULL
        CHECK (organization_type IN ('EMPLOYER', 'INSTITUTION', 'GOVERNMENT', 'PLATFORM')),
    status varchar(30) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED', 'CLOSED')),
    country_code char(2) NOT NULL DEFAULT 'KE',
    county varchar(100),
    website_url text,
    verified_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    UNIQUE (country_code, registration_number)
);

CREATE TRIGGER organization_set_updated_at
BEFORE UPDATE ON gavahub.organization
FOR EACH ROW EXECUTE FUNCTION gavahub.set_updated_at();

CREATE TABLE gavahub.organization_member (
    organization_id uuid NOT NULL REFERENCES gavahub.organization(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES gavahub.app_user(id) ON DELETE CASCADE,
    member_role varchar(40) NOT NULL
        CHECK (member_role IN ('OWNER', 'ADMIN', 'VERIFIER', 'RECRUITER', 'FINANCE', 'AUDITOR', 'MEMBER')),
    status varchar(30) NOT NULL DEFAULT 'INVITED'
        CHECK (status IN ('INVITED', 'ACTIVE', 'SUSPENDED', 'REMOVED')),
    joined_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (organization_id, user_id)
);

CREATE TRIGGER organization_member_set_updated_at
BEFORE UPDATE ON gavahub.organization_member
FOR EACH ROW EXECUTE FUNCTION gavahub.set_updated_at();

CREATE TABLE gavahub.candidate_profile (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE REFERENCES gavahub.app_user(id) ON DELETE RESTRICT,
    given_name varchar(120) NOT NULL,
    family_name varchar(120) NOT NULL,
    national_id_hash varchar(128) UNIQUE,
    date_of_birth date,
    headline varchar(200),
    profile_status varchar(30) NOT NULL DEFAULT 'DRAFT'
        CHECK (profile_status IN ('DRAFT', 'ACTIVE', 'SUSPENDED', 'ARCHIVED')),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TRIGGER candidate_profile_set_updated_at
BEFORE UPDATE ON gavahub.candidate_profile
FOR EACH ROW EXECUTE FUNCTION gavahub.set_updated_at();

CREATE INDEX app_user_status_idx ON gavahub.app_user(status);
CREATE INDEX organization_type_status_idx ON gavahub.organization(organization_type, status);
CREATE INDEX organization_member_user_idx ON gavahub.organization_member(user_id, status);
