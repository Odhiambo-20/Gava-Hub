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
3. Set `DATABASE_URL` to the hosted PostgreSQL URL, `DATABASE_SSL=true`, and run `npm run db:migrate` against that database
4. Provide a fresh `JWT_SECRET` (≥32 chars), `SMTP_HOST`, and exact `CORS_ALLOWED_ORIGINS`
5. Terminate TLS at the host/proxy; never expose Postgres publicly
6. Configure persistent document storage (or object storage) before accepting uploads
7. Replace all payment placeholders with verified production credentials before enabling payments
