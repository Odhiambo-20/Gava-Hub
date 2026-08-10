# Gava Hub backend

Spring Boot modular monolith for identity, organizations, candidates, credentials, verification,
documents, billing, M-Pesa payments, notifications, and audit records.

## Local run

1. Install JDK 25, Maven 3.9+, and Docker with Compose.
2. Copy `../infrastructure/docker/.env.example` to `../infrastructure/docker/.env` and replace every secret.
3. Start dependencies: `docker compose -f ../infrastructure/docker/docker-compose.yml up -d postgres redis`.
4. Run: `mvn spring-boot:run`.
5. Read the OpenAPI contract at `http://localhost:8080/api-docs/openapi.yaml`.

Never commit the populated `.env`. Safaricom Daraja credentials must come from the Daraja portal;
the application intentionally contains placeholders only. The callback URL must be public HTTPS.

## Tests

Run `mvn test`. The context test uses Testcontainers to start a clean PostgreSQL 17 instance and
apply every Flyway migration.
