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

```bash
# From repo root, with Postgres running:
psql "postgresql://gavahub:gavahub_local_dev_change_me@127.0.0.1:5433/gavahub" \
  -f db/schema/001_gavahub_schema.sql
```

Or via Docker:

```bash
docker compose -f infrastructure/docker/docker-compose.yml exec -T postgres \
  psql -U gavahub -d gavahub < db/schema/001_gavahub_schema.sql
```

## Backend connection

In `backend/.env`:

```env
DATABASE_URL=postgresql://gavahub:gavahub_local_dev_change_me@127.0.0.1:5433/gavahub
```

Without `DATABASE_URL`, the Node backend uses an in-memory store (fine for quick UI work; data is lost on restart).

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
