# Wihl Verify Node.js backend

The backend now runs on Node.js 22 with Express. It exposes the `/api/v1`
contract used by the frontend, health and system status endpoints, Co-op
PayBill configuration, registration, contact submission, and CRUD route
scaffolding for the remaining modules.

The current storage is an in-process development store. PostgreSQL, Redis,
JWT authentication, file storage, notifications, verification workflows, and
Co-op payment confirmation still need to be connected before production use.

```bash
npm install
npm start
```
