# Gava Hub

Gava Hub is a credential verification and payment platform for candidates,
employers, and institutions. It is implemented as a modular monolith with a
React frontend, Spring Boot backend, PostgreSQL database, Redis, M-Pesa
payments, notifications, audit records, and production monitoring.

## Repository layout

- `frontend/` — React 19, TanStack Start, TypeScript, Vite, and Tailwind CSS.
- `backend/` — Java 17 and Spring Boot modular monolith.
- `infrastructure/` — Docker Compose, Nginx, PostgreSQL, Redis, Prometheus, and Grafana.
- `docs/` — architecture and API documentation.

## Implemented features

- Registration and login with candidate, employer, and institution onboarding.
- User profiles, roles, organizations, and organization members.
- Candidate profiles, credentials, and document storage.
- Verification requests, decisions, and reconciliation records.
- Invoices, M-Pesa STK Push, callback processing, and payment-status queries.
- Email/SMS notification queue, contact enquiries, and audit records.
- Authenticated dashboards for profile, organizations, documents, credentials,
  verification, billing, notifications, and administration.

## Requirements

- Java 17
- Maven 3.8.7 or newer
- Node.js 22.12 or newer
- npm
- Docker with Docker Compose

## Run locally

Start PostgreSQL and Redis first:

```bash
cd infrastructure/docker
docker compose up -d postgres redis
docker compose ps
```

The local containers are available only on loopback:

- PostgreSQL: `localhost:5433`
- Redis: `localhost:6380`

Start the backend in another terminal:

```bash
cd backend
mvn spring-boot:run
```

Verify it:

```bash
curl http://localhost:8080/actuator/health
```

Start the frontend in another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend normally runs at `http://localhost:3000`; the API runs at
`http://localhost:8080`. Opening the API root directly can return `401` because
application endpoints require authentication.

## Verification commands

```bash
cd backend
mvn clean test
mvn clean package
```

```bash
cd frontend
npx tsc --noEmit
npm run lint
npm run build
```

Backend integration tests use Testcontainers and require Docker. Flyway applies
the database schema automatically; do not create application tables manually.

## Production configuration

Activate the `production` Spring profile and configure secrets through the
cloud provider's secret manager. Required groups include:

- PostgreSQL: `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`.
- Redis: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`.
- Security: `GAVA_HUB_JWT_SECRET`, `PUBLIC_BASE_URL`, `CORS_ALLOWED_ORIGINS`.
- Daraja: `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`,
  `MPESA_PASSKEY`, `MPESA_CALLBACK_BASE_URL`, and `MPESA_CALLBACK_SECRET`.
- Email/SMS: SMTP settings, sender/support addresses, and optional SMS provider settings.
- Documents: a persistent private filesystem volume; add an object-storage
  adapter before horizontally scaling the backend.

Never commit populated `.env` files or real credentials. M-Pesa callbacks must
use a publicly reachable HTTPS backend URL. Sandbox credentials must be replaced
with the production credentials issued by Safaricom after go-live.

## Monitoring and operations

Prometheus scrapes `/actuator/prometheus`, while Grafana uses the provisioned
Prometheus data source and dashboards. In production, keep Prometheus private,
place Grafana behind HTTPS, use persistent storage, and configure database
backups and alert delivery.

See [backend/README.md](backend/README.md) and
[infrastructure/README.md](infrastructure/README.md) for component-specific details.
