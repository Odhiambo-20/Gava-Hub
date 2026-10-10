# Database

PostgreSQL schema for Gava Hub / Wihl Verify.

## Start Postgres & Redis (from repo root)

```bash
cd infrastructure/docker
cp .env.example .env   # if not already present
# edit .env — set POSTGRES_PASSWORD and REDIS_PASSWORD at minimum
docker compose up -d postgres redis
docker compose ps
```

- PostgreSQL: `localhost:5433`
- Redis: `localhost:6380`
- Database / user (defaults): `gavahub` / `gavahub`

## Apply schema

Use a **clean PostgreSQL database** for this Node.js API. The existing `gavahub`
database in some older local deployments may contain a different schema and
should not be overwritten or treated as compatible. Create a separate database
named `gavahub_api` (or provision a fresh production database), then apply the
schema once.

```bash
# From repo root, with Postgres running and a clean gavahub_api database:
psql "$DATABASE_URL" \
  -f db/schema/001_gavahub_schema.sql
```

Or via Docker:

```bash
docker compose -f infrastructure/docker/docker-compose.yml exec postgres \
  createdb -U gavahub gavahub_api
docker compose -f infrastructure/docker/docker-compose.yml exec -T postgres \
  psql -U gavahub -d gavahub_api < db/schema/001_gavahub_schema.sql
```

Or from `backend/` when `DATABASE_URL` is set in the environment or `backend/.env`:

```bash
npm run db:migrate
```

## Backend connection

In `backend/.env`:

```env
DATABASE_URL=postgresql://gavahub:<your-password>@127.0.0.1:5433/gavahub_api
```

`DATABASE_URL` is required by the backend. It no longer falls back to an in-memory store.

## Tables (schema `gavahub`)

| Table | Purpose |
| --- | --- |
| `app_user` / `user_role` | Accounts and roles |
| `candidate_profile` | Candidate profiles |
| `organization` / `organization_member` | Employers & institutions |
| `document` | Uploaded files metadata |
| `credential` | Issued credentials |
| `verification` | Verification requests & decisions |
| `invoice` / `payment` | Billing |
| `notification` | Email/SMS queue |
| `audit_event` | Audit trail |
| `contact_enquiry` | Public contact form |
