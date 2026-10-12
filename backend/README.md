# Wihl Verify — Node.js backend

Production-oriented Express API that implements the exact `/api/v1` contract
used by the React (TanStack Start) frontend.

## Stack

- Node.js 22+, Express 5, ES modules
- JWT (Bearer) auth with role-based access
- bcrypt password hashing
- PostgreSQL is required for all API data; the server does not start without `DATABASE_URL`
- Optional Redis
- Local filesystem document storage (S3-ready config hooks)
- Co-op PayBill + M-Pesa STK Push scaffolding
- Structured error body matching the frontend `ApiError` shape

## Quick start

```bash
cp .env.example .env
npm install
npm run dev   # http://localhost:8080
```

Frontend Vite proxies `/api` and `/actuator` to this server. Leave
`VITE_API_BASE_URL` unset in the frontend for local development.

## Frontend contract alignment

| Frontend call | Backend route |
| --- | --- |
| `POST /auth/register` | TokenResponse |
| `POST /auth/login` | TokenResponse |
| `POST /contact` | ContactResponse |
| `GET/PUT /users/:id` | User |
| `GET/POST/DELETE /users/:id/roles` | roles |
| `GET /candidates?userId=` | Candidate[] |
| `GET/PUT /organizations` | Organization |
| `GET/POST /organizations/:id/members` | members |
| `GET/POST/DELETE /documents` + `/content` | DocumentRecord |
| `GET/POST/DELETE /credentials` | Credential |
| `GET/POST/PUT /verifications` + `/decisions` | Verification |
| `GET/POST /invoices` | Invoice |
| `GET /payments/configuration` | paybill config |
| `POST /payments/mpesa/stk-push` | Payment |
| `GET /payments?userId=` | Payment[] |
| `GET/POST /notifications` | NotificationRecord |
| `GET /audit` | AuditEvent[] |
| `GET /system/status` | SystemStatus |
| `GET /actuator/health` | health |

## Production checklist

1. Set `NODE_ENV=production`
2. Copy `.env.production.example` as a checklist and set secrets in the hosting provider, not in Git
3. Set `DATABASE_URL` to the PostgreSQL connection URL and run `npm run db:migrate` against that database. For PostgreSQL on the same cPanel server, use its local host and `DATABASE_SSL=false`; for a remote database, use its TLS-enabled provider connection and `DATABASE_SSL=true`.
4. Provide a fresh `JWT_SECRET` (≥32 chars) and exact `CORS_ALLOWED_ORIGINS`
5. Terminate TLS at the host/proxy; never expose Postgres publicly
6. Configure persistent document storage (or object storage) before accepting uploads
7. Replace all payment placeholders with verified production credentials before enabling payments

### cPanel deployment notes

- Use Node.js 22 or newer, `backend/` as the application root, and `app.js` as the startup file. `npm start` runs the same server via `src/server.js`.
- The API server listens on `PORT` supplied by cPanel. Set the app URL to an API hostname such as `api.wihlverify.org` and ensure HTTPS is enabled for that hostname.
- The PostgreSQL database wizard may use a local database host. Production permits a loopback database only when `DATABASE_SSL=false`; this is suitable only when the Node app and PostgreSQL are on the same cPanel host. Remote databases must use TLS.
- Set `DOCUMENT_LOCAL_ROOT` to a persistent directory outside `public_html`; back it up because uploaded documents are stored there.
- Apply the schema once with `npm run db:migrate` after configuring the database connection. The migration script expects the repository's top-level `db/schema/001_gavahub_schema.sql`, so deploy the full repository and set the Node application root to its `backend/` directory.
- Outbound SMTP is not currently implemented, so `SMTP_*` values are not required to start the API. Email delivery still needs to be implemented and tested before relying on it.
