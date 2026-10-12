# Wihl Verify frontend

React and TanStack Start application for the Wihl Verify credential verification
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
- Wihl Verify backend running on port `8080` for local integration

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

`VITE_API_BASE_URL` is embedded into the frontend when it is built. Configure
it in the build environment (not only in cPanel's runtime environment) before
running `npm run build`. Use your backend's real HTTPS API URL. Do not commit a
production `.env` file or put any server secrets in this variable.

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
npm run start      # run the production Nitro server
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
VITE_API_BASE_URL=https://YOUR_DEPLOYED_BACKEND_HOST/api/v1 npm run build
```

Replace `https://YOUR_DEPLOYED_BACKEND_HOST/api/v1` with the backend's real
public HTTPS base URL. The production build now stops if this value is missing,
uses HTTP/localhost, or omits `/api/v1`. Set it on the command that builds the
frontend; cPanel's runtime environment variables alone cannot change a URL
already embedded in the built browser assets.

Production requirements:

- Use Node.js 22.12 or newer, matching the `engines` field in `package.json`.
- The production server entry point is `.output/server/index.mjs`; the start
  command is `npm run start` (`node .output/server/index.mjs`). Build output is
  an SSR application, so do not upload it as a static-only site to `public_html`.
- In cPanel's Node.js application, use the project directory as the application
  root and set `app.js` as the startup file. This small cPanel-compatible entry
  imports the generated Nitro server. Select Node.js 22.12 or newer, set the
  application mode to Production, install dependencies with `npm ci`, build
  with the HTTPS API URL supplied in the build environment, and restart the
  application. The equivalent direct start command is `npm run start`. Confirm
  the provider supports the required Node version and SSR process. Follow
  [cPanel's Node.js application setup guide](https://docs.cpanel.net/knowledge-base/web-services/how-to-install-a-node.js-application/).
- Serve the application over HTTPS.
- Route `/api` to the deployed backend through Nginx or a cloud load balancer.
- Configure the exact frontend origins in backend CORS settings.
- Configure security headers and a restrictive Content Security Policy.
- Keep all backend credentials in the server-side secret manager.
- Test registration, document upload, verification, M-Pesa callbacks, role
  authorization, and session expiry in staging before releasing.

See the repository [README](../README.md) and [backend README](../backend/README.md)
for the complete stack and production environment configuration.
