# Gava Hub frontend

React and TanStack Start application for the Gava Hub credential verification
platform. It provides public product pages, authentication, candidate and
organization workflows, document and credential management, verification,
billing, M-Pesa payments, notifications, and administration.

## Technology

- React 19
- TanStack Start and TanStack Router
- TypeScript
- Vite
- Tailwind CSS
- React Query
- React Hook Form and Zod

## Requirements

- Node.js 22.12 or newer
- npm
- Gava Hub backend running on port `8080` for local integration

## Install and run

```bash
cd frontend
npm install
npm run dev
```

The development server normally runs at:

```text
http://localhost:3000
```

Vite proxies `/api` and `/actuator` requests to `http://localhost:8080`, so start
the backend and its PostgreSQL/Redis dependencies before testing authenticated
workflows.

## API configuration

Configuration is documented in `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

For local development, either use that URL or leave the variable unset and use
the Vite proxy. Restart the frontend after changing environment variables.

For production with the frontend and backend behind the same Nginx domain,
leave `VITE_API_BASE_URL` unset so requests use the same origin. If the API is
hosted separately, set the complete HTTPS versioned URL at build time:

```env
VITE_API_BASE_URL=https://api.yourdomain.example/api/v1
```

The backend's `CORS_ALLOWED_ORIGINS` must contain the exact frontend origin.
Never put database, JWT, M-Pesa, SMTP, or other server secrets in a `VITE_`
variable; Vite variables are included in browser-delivered code.

## Routes

Public routes include:

- `/` — landing page.
- `/about`, `/how-it-works`, and `/faq` — platform information.
- `/for-candidates`, `/for-employers`, and `/for-institutions` — audience pages.
- `/contact` — contact enquiry form connected to the backend.
- `/login` — registration and login.

Authenticated dashboard routes include:

- `/dashboard` — account overview.
- `/dashboard/profile` — user and candidate profile management.
- `/dashboard/organizations` — organizations and members.
- `/dashboard/documents` — upload, download, list, and delete documents.
- `/dashboard/credentials` — create, list, and revoke credentials.
- `/dashboard/verifications` — request verification and record decisions.
- `/dashboard/billing` — invoices, M-Pesa STK Push, and payment status.
- `/dashboard/notifications` — notification queue and history.
- `/dashboard/admin` — users, roles, invoices, audit records, and system status.

Administration requires `ROLE_ADMIN`. Verification decisions require
`ROLE_ADMIN` or `ROLE_VERIFIER`. Users must sign in again after receiving a new
role so their JWT contains the updated authorities.

## Authentication

Registration supports Candidate, Employer, and Institution account types. The
backend creates the corresponding candidate profile or organization during
registration. After login, the frontend stores the bearer-token session in
browser local storage and attaches it to authenticated API calls. Signing out or
token expiry clears the stored session.

## Scripts

```bash
npm run dev        # start the development server
npm run build      # create a production build
npm run preview    # preview the production build
npm run lint       # run ESLint
npm run format     # format files with Prettier
npx tsc --noEmit   # run TypeScript checking without emitting files
```

Before committing or deploying frontend changes, run:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

## Production deployment

Build the frontend with production API configuration supplied by the deployment
platform:

```bash
npm ci
npm run build
```

Production requirements:

- Serve the application over HTTPS.
- Route `/api` to the Spring Boot backend through Nginx or a cloud load balancer.
- Configure the exact frontend origins in backend CORS settings.
- Configure security headers and a restrictive Content Security Policy.
- Keep all backend credentials in the server-side secret manager.
- Test registration, document upload, verification, M-Pesa callbacks, role
  authorization, and session expiry in staging before releasing.

See the repository [README](../README.md) and [backend README](../backend/README.md)
for the complete stack and production environment configuration.
