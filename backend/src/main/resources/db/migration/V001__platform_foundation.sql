CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS gavahub;

CREATE OR REPLACE FUNCTION gavahub.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = clock_timestamp();
    RETURN NEW;
END;
$$;

CREATE TABLE gavahub.schema_metadata (
    id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    application_name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

INSERT INTO gavahub.schema_metadata (application_name)
VALUES ('gava-hub-backend');
