# Docwise deployment

Dokploy builds the `docwise-v0.3.0` branch of `HammadBukhari/elmo-docwise` using `compose.dokploy.yaml`. The branch name is retained for deployment continuity; it includes upstream main through `c7e9e0d0` (2026-09-16), including Elmo 0.4.1.

Service `dcXDB0tMmq9acyXH15yfo` in Elmo / production serves https://grow.docwise.org. Retain app name `elmo-grow-wm02lj` and its PostgreSQL volume. Application, worker, and migrations build from the same source revision. Deployment runs the upstream migrations before starting the application.

Docwise branding, its website link, and UK scraper defaults are retained. Secrets stay in Dokploy Environment. Preserve provider configuration, `COMPOSE_PROFILES=tracking`, `SCRAPE_TARGETS`, and `DEFAULT_DELAY_HOURS=168`.

Before a schema upgrade, take a database backup. A rollback across schema changes requires restoring that matching backup as well as the prior application revision; redeploying an older image alone is insufficient.
