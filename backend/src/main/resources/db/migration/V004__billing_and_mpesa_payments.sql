CREATE TABLE gavahub.product (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(80) NOT NULL UNIQUE,
    name varchar(160) NOT NULL,
    description text,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TRIGGER product_set_updated_at
BEFORE UPDATE ON gavahub.product
FOR EACH ROW EXECUTE FUNCTION gavahub.set_updated_at();

CREATE TABLE gavahub.price (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES gavahub.product(id) ON DELETE RESTRICT,
    amount numeric(19,2) NOT NULL CHECK (amount >= 0),
    currency char(3) NOT NULL DEFAULT 'KES',
    billing_period varchar(30) CHECK (billing_period IN ('ONE_TIME', 'MONTHLY', 'ANNUAL')),
    valid_from timestamptz NOT NULL DEFAULT clock_timestamp(),
    valid_until timestamptz,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    CHECK (valid_until IS NULL OR valid_until > valid_from)
);

CREATE TABLE gavahub.invoice (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number varchar(40) NOT NULL UNIQUE,
    billed_user_id uuid REFERENCES gavahub.app_user(id) ON DELETE RESTRICT,
    billed_organization_id uuid REFERENCES gavahub.organization(id) ON DELETE RESTRICT,
    verification_request_id uuid REFERENCES gavahub.verification_request(id) ON DELETE RESTRICT,
    status varchar(30) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'OPEN', 'PAID', 'VOID', 'OVERDUE', 'REFUNDED')),
    subtotal numeric(19,2) NOT NULL CHECK (subtotal >= 0),
    tax numeric(19,2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
    total numeric(19,2) NOT NULL CHECK (total >= 0),
    currency char(3) NOT NULL DEFAULT 'KES',
    due_at timestamptz,
    paid_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    CHECK (billed_user_id IS NOT NULL OR billed_organization_id IS NOT NULL),
    CHECK (total = subtotal + tax)
);

CREATE TRIGGER invoice_set_updated_at
BEFORE UPDATE ON gavahub.invoice
FOR EACH ROW EXECUTE FUNCTION gavahub.set_updated_at();

CREATE TABLE gavahub.invoice_item (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id uuid NOT NULL REFERENCES gavahub.invoice(id) ON DELETE CASCADE,
    product_id uuid REFERENCES gavahub.product(id) ON DELETE RESTRICT,
    description varchar(255) NOT NULL,
    quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_amount numeric(19,2) NOT NULL CHECK (unit_amount >= 0),
    line_total numeric(19,2) NOT NULL CHECK (line_total >= 0),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    CHECK (line_total = quantity * unit_amount)
);

CREATE TABLE gavahub.payment (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id uuid NOT NULL REFERENCES gavahub.invoice(id) ON DELETE RESTRICT,
    initiated_by_user_id uuid NOT NULL REFERENCES gavahub.app_user(id) ON DELETE RESTRICT,
    provider varchar(30) NOT NULL CHECK (provider IN ('MPESA', 'BANK', 'MANUAL')),
    amount numeric(19,2) NOT NULL CHECK (amount > 0),
    currency char(3) NOT NULL DEFAULT 'KES',
    status varchar(30) NOT NULL DEFAULT 'CREATED'
        CHECK (status IN ('CREATED', 'PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED', 'UNKNOWN', 'RECONCILING', 'REVERSED')),
    idempotency_key varchar(100) NOT NULL UNIQUE,
    failure_code varchar(80),
    failure_reason text,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TRIGGER payment_set_updated_at
BEFORE UPDATE ON gavahub.payment
FOR EACH ROW EXECUTE FUNCTION gavahub.set_updated_at();

CREATE TABLE gavahub.mpesa_transaction (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id uuid NOT NULL REFERENCES gavahub.payment(id) ON DELETE RESTRICT,
    transaction_type varchar(30) NOT NULL
        CHECK (transaction_type IN ('STK_PUSH', 'C2B', 'B2C', 'REVERSAL')),
    phone_number_ciphertext bytea,
    phone_number_hash char(64),
    merchant_request_id varchar(100),
    checkout_request_id varchar(100) UNIQUE,
    mpesa_receipt_number varchar(100) UNIQUE,
    result_code varchar(30),
    result_description text,
    transaction_at timestamptz,
    request_payload jsonb,
    response_payload jsonb,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TRIGGER mpesa_transaction_set_updated_at
BEFORE UPDATE ON gavahub.mpesa_transaction
FOR EACH ROW EXECUTE FUNCTION gavahub.set_updated_at();

CREATE TABLE gavahub.payment_webhook_event (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider varchar(30) NOT NULL,
    event_key varchar(200) NOT NULL UNIQUE,
    headers jsonb NOT NULL DEFAULT '{}'::jsonb,
    payload jsonb NOT NULL,
    processing_status varchar(30) NOT NULL DEFAULT 'RECEIVED'
        CHECK (processing_status IN ('RECEIVED', 'PROCESSING', 'PROCESSED', 'DUPLICATE', 'FAILED')),
    error_message text,
    received_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    processed_at timestamptz
);

CREATE TABLE gavahub.payment_reconciliation (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id uuid NOT NULL REFERENCES gavahub.payment(id) ON DELETE RESTRICT,
    attempted_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    provider_status varchar(50),
    result varchar(30) NOT NULL CHECK (result IN ('MATCHED', 'MISMATCH', 'PENDING', 'FAILED')),
    response_payload jsonb,
    error_message text
);

CREATE TABLE gavahub.refund (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id uuid NOT NULL REFERENCES gavahub.payment(id) ON DELETE RESTRICT,
    amount numeric(19,2) NOT NULL CHECK (amount > 0),
    reason text NOT NULL,
    status varchar(30) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    provider_reference varchar(100),
    requested_by_user_id uuid NOT NULL REFERENCES gavahub.app_user(id) ON DELETE RESTRICT,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TRIGGER refund_set_updated_at
BEFORE UPDATE ON gavahub.refund
FOR EACH ROW EXECUTE FUNCTION gavahub.set_updated_at();

CREATE INDEX price_product_active_idx ON gavahub.price(product_id, active, valid_from);
CREATE INDEX invoice_billed_user_idx ON gavahub.invoice(billed_user_id, status);
CREATE INDEX invoice_billed_org_idx ON gavahub.invoice(billed_organization_id, status);
CREATE INDEX payment_invoice_status_idx ON gavahub.payment(invoice_id, status);
CREATE INDEX payment_pending_idx ON gavahub.payment(updated_at) WHERE status IN ('PENDING', 'UNKNOWN', 'RECONCILING');
CREATE INDEX mpesa_merchant_request_idx ON gavahub.mpesa_transaction(merchant_request_id);
CREATE INDEX mpesa_phone_hash_idx ON gavahub.mpesa_transaction(phone_number_hash);
CREATE INDEX webhook_unprocessed_idx ON gavahub.payment_webhook_event(received_at) WHERE processing_status IN ('RECEIVED', 'FAILED');
