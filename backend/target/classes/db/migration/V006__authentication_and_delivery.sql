ALTER TABLE gavahub.app_user ADD COLUMN password_hash varchar(255);

INSERT INTO gavahub.role (code, name, description) VALUES
 ('ROLE_USER', 'User', 'Standard authenticated user'),
 ('ROLE_ADMIN', 'Administrator', 'Platform administrator'),
 ('ROLE_VERIFIER', 'Verifier', 'Credential verification officer')
ON CONFLICT (code) DO NOTHING;

ALTER TABLE gavahub.payment_webhook_event
    ADD COLUMN signature_valid boolean NOT NULL DEFAULT false;

CREATE INDEX app_user_email_status_idx ON gavahub.app_user(email, status);

ALTER TABLE gavahub.notification ADD COLUMN destination varchar(320);
