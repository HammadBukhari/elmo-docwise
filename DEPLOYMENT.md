# Docwise deployment

This fork deploys the `docwise-v0.3.0` branch, based on upstream tag `v0.3.0`. The sidebar website link and tooltip point to `https://docwise.org/`.

Dokploy service `6ahOmWHInf9dVYjgtOIeb` in Elmo / production uses `compose.dokploy.yaml`. Web and worker build from this fork using the upstream Dockerfile. PostgreSQL and the matching migration image remain pinned to their existing versions. Secrets stay in Dokploy Environment and are not committed.

Retain the existing Dokploy app name `elmo-grow-2hhkzf` so Compose continues to use its existing PostgreSQL volume. Keep the configured provider keys, `COMPOSE_PROFILES=tracking`, `SCRAPE_TARGETS`, and `DEFAULT_DELAY_HOURS=168` when redeploying.

The original image-based deployment configuration is kept separately in `../emlo-deployment` for rollback. To roll back, restore its Compose file as the Dokploy Raw source, retain all environment values, and redeploy the same service.
