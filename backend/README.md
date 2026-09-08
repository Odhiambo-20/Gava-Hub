# Wihl Verify backend

Spring Boot modular monolith for identity, organizations, candidates,
credentials, documents, verification, billing, M-Pesa payments, notifications,
contact enquiries, administration, and audit records.

## Technology

- Java 17
- Spring Boot 4.1
- Maven 3.8.7+
- PostgreSQL 17 with Flyway
- Redis
- Spring Security with signed JWT bearer tokens
- Testcontainers for PostgreSQL integration tests
- Spring Boot Actuator and Prometheus metrics

## Modules

Application code is under `src/main/java/com/gavahub` and is divided by business
capability:

- `identity` — registration, authentication, users, and roles.
- `organization` — employers, institutions, and members.
- `candidate` — candidate profiles.
- `document` and `credential` — document storage and credential records.
- `verification` — requests, consent, decisions, and events.
- `billing` and `payment` — invoices, M-Pesa STK Push, callbacks, and reconciliation.
- `notification` and `contact` — email/SMS delivery and contact enquiries.
- `audit` and `administration` — audit records and system administration.

## Local infrastructure

The local profile expects the project containers on these loopback ports:

| Service | Address | Credentials source |
| --- | --- | --- |
| PostgreSQL | `localhost:5433` | `infrastructure/docker/.env` |
| Redis | `localhost:6380` | `infrastructure/docker/.env` |

Start them from the repository root:

```bash
cd infrastructure/docker
docker compose up -d postgres redis
docker compose ps
```

Both services should report `healthy`. Changing a Redis password requires
recreating the Redis container. Changing `POSTGRES_PASSWORD` after the database
volume has been initialized also requires changing the `gavahub` database role's
password; changing the Compose variable alone is insufficient.

## Run the backend

### VS Code setup

The repository's `.vscode/settings.json` maps Java 17 to
`/usr/lib/jvm/java-17-openjdk-amd64`. Adjust this path if your JDK is installed
elsewhere. Maven and the project both require Java 17.

If the Problems panel reports `release 25 is not found in the system`, run
**Java: Clean Java Language Server Workspace** from the Command Palette
(`Ctrl+Shift+P`) and allow VS Code to restart. This clears stale compiler
settings and reimports the Maven project with Java 17.

Workspace settings also exclude dependencies and generated build directories
from file watching to reduce Linux file watcher usage.

### Start the application

```bash
cd backend
mvn spring-boot:run
```

The default profile is `local`. The backend listens on port `8080`.

Useful endpoints:

- Health: `http://localhost:8080/actuator/health`
- Prometheus: `http://localhost:8080/actuator/prometheus`
- OpenAPI file: `http://localhost:8080/api-docs/openapi.yaml`

A `401 Unauthorized` response from `/` is expected because the API root is not
a public website. Run the frontend separately to use the browser application.

If local database or Redis passwords differ from the defaults, export them before starting:

```bash
export DATABASE_PASSWORD="<local-database-password>"
export REDIS_PASSWORD="<local-redis-password>"
mvn spring-boot:run
```

## Database migrations

Flyway migrations are stored under `src/main/resources/db/migration`. They create
and update the `gavahub` schema automatically at startup. Migration history is
recorded in `gavahub.flyway_schema_history`.

Inspect the database with:

```bash
cd infrastructure/docker
docker compose exec postgres psql -U gavahub -d gavahub
```

Then run:

```sql
SET search_path TO gavahub;
\dt
```

Do not manually recreate tables already managed by Flyway.

## Tests and packaging

```bash
mvn clean test
mvn clean package
```

Integration tests start a clean PostgreSQL 17 Testcontainer and apply every
Flyway migration. Docker must be running. The packaged executable JAR is written
to `target/gava-hub-backend.jar`.

## Production environment

Set:

```env
SPRING_PROFILES_ACTIVE=production

DATABASE_URL=jdbc:postgresql://<private-host>:5432/gavahub
DATABASE_USERNAME=gavahub
DATABASE_PASSWORD=<secret>

REDIS_HOST=<private-host>
REDIS_PORT=6379
REDIS_PASSWORD=<secret>

GAVA_HUB_JWT_SECRET=<at-least-32-random-bytes>
PUBLIC_BASE_URL=https://yourdomain.example
CORS_ALLOWED_ORIGINS=https://yourdomain.example

SMTP_HOST=<smtp-host>
SMTP_PORT=587
SMTP_USERNAME=<smtp-user>
SMTP_PASSWORD=<smtp-secret>
NOTIFICATION_FROM_EMAIL=info@wihlverify.org
CONTACT_SUPPORT_EMAIL=info@wihlverify.org

SMS_PROVIDER_URL=<provider-endpoint>
SMS_PROVIDER_API_KEY=<provider-secret>

DOCUMENT_STORAGE_PROVIDER=LOCAL
DOCUMENT_LOCAL_ROOT=/var/lib/gavahub/documents
DOCUMENT_BUCKET=<configured-storage-name>
OBJECT_STORAGE_ENDPOINT=
OBJECT_STORAGE_REGION=<region>
```

The current implementation stores documents on the local filesystem. Mount a
persistent private volume at `DOCUMENT_LOCAL_ROOT` for a single backend instance,
or implement an object-storage adapter before running multiple backend replicas.

Use managed PostgreSQL and Redis on private networks where possible. Store all
secrets in the deployment platform's secret manager, restrict CORS to the final
frontend origins, terminate TLS at the load balancer or Nginx, and configure
database backups and document-storage retention.

## Co-op Bank payments: integration pending

The selected payment method is now `COOP_PAYBILL`, using PayBill `400200` and
account `1195351`. Configure these values on the backend (Docker Compose forwards
them):

```env
PAYMENT_METHOD=COOP_PAYBILL
COOP_PAYBILL_NUMBER=400200
COOP_ACCOUNT_NUMBER=1195351
```

This is preparation, not a live bank integration. The billing page displays a
payment-unavailable notice and new Daraja STK requests return HTTP 409 in Co-op
mode. `GET /api/v1/payments/configuration` requires authentication and reports
`available: false`. There is deliberately no environment switch that enables
Co-op collection without a verified adapter.

The public [INS simulator specification](https://developer.co-opbank.co.ke/api/am/store/v1/apis/680af948-e960-4c2e-a11a-e654520925ad/swagger)
provides the notification fields and an optional Basic Authentication credential
for the callback endpoint. Its posting `AccountNumber` is **14 digits**; the
customer payment code `1195351` must not be assumed to be that account number.
Confirm the linked posting account and invoice reference mapping with Co-op.

To complete automatic confirmation, confirm the enabled service's bank contract:
notification payload and authentication, sandbox/production endpoints, retry and
acknowledgement rules, transaction lookup/reconciliation API, reversal handling,
and the supported invoice-matching reference. Do not append an invoice number to
account `1195351` without bank confirmation that this routing format is supported.
Do not match deposits by amount alone.

The adapter must validate notifications and receiving account, deduplicate bank
transaction IDs, and atomically match the correct invoice, amount and currency
before recording payment and marking the invoice paid. Unmatched deposits and
reversals require an explicit reconciliation workflow. Production activation
requires sandbox end-to-end tests and bank approval.

Existing Daraja callbacks and reconciliation remain for previously initiated
transactions. Keep their existing credentials while those transactions settle.
`PAYMENT_METHOD=DARAJA` restores the legacy STK flow for an authorized Daraja
shortcode; it does not enable Co-op PayBill collection.

Reference: [Co-op payment notification services](https://www.co-opbank.co.ke/corporate/ict-infrastructure-construction/).

## M-Pesa Daraja (legacy)

Sandbox:

```env
MPESA_ENVIRONMENT=sandbox
MPESA_CONSUMER_KEY=<sandbox-app-key>
MPESA_CONSUMER_SECRET=<sandbox-app-secret>
MPESA_SHORTCODE=174379
MPESA_PASSKEY=<sandbox-passkey-from-Daraja-test-data>
MPESA_CALLBACK_BASE_URL=https://<public-backend>/api/v1/webhooks/mpesa
MPESA_CALLBACK_SECRET=<random-url-safe-secret>
```

The backend appends `/stk?token=...` to the callback base URL. The callback URL
must be public HTTPS; Safaricom cannot call `localhost`. The backend creates the
timestamp and encoded Daraja password for each request, so neither belongs in
environment configuration.

For production, complete Safaricom's go-live process and replace every sandbox
credential with the issued production values. Do not reuse sandbox credentials.

## Roles and administration

Registration creates a user plus the selected candidate profile or employer/
institution organization. Administrative screens require `ROLE_ADMIN`, and
verification decisions require `ROLE_ADMIN` or `ROLE_VERIFIER`. After granting a
new role, sign in again so the new JWT includes it.
