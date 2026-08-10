# Gava Hub infrastructure

This directory contains the container, reverse-proxy, database, cache, and
monitoring configuration for Gava Hub.

## Start PostgreSQL and Redis

```bash
cd infrastructure/docker
cp .env.example .env
# Replace every placeholder secret in .env before continuing.
docker compose up -d postgres redis
```

## Start the complete application

The full stack expects the frontend and backend images named in `.env` to have
already been built and published or loaded locally.

```bash
docker compose --profile app up -d
```

## Start monitoring

The backend must expose Spring Boot Actuator's Prometheus endpoint at
`/actuator/prometheus`.

```bash
docker compose --profile app --profile monitoring up -d
```

Grafana is exposed on port `3001` by default. PostgreSQL and Redis are only
reachable on Docker's internal data network and are not published to the host.

## Production notes

- Store secrets in the deployment platform's secrets manager, not `.env`.
- Terminate TLS at the cloud load balancer or add mounted certificates to Nginx.
- Use a managed PostgreSQL service with point-in-time recovery for production.
- Send backups to a different account or region and test restoration regularly.
- Pin and update container digests through an automated dependency process.
