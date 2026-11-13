# RetailX AI Commerce Platform

Search smarter. Shop faster. Keep stock accurate with Aiven PostgreSQL, Apache Kafka, and OpenSearch at the center of the platform.

## Architecture

- Next.js 15 serves the responsive storefront, assistant, order workflow, and protected operations console.
- Express and Prisma write transactional catalog, cart, order, and inventory data to Aiven PostgreSQL.
- PostgreSQL outbox records make order and inventory events durable before Kafka publishes them.
- Kafka carries `order-created`, `inventory-updated`, `search-sync`, and `admin-events` messages. The API creates these topics at startup; the Aiven Kafka user needs topic administration and read/write permissions.
- The consumer processes orders, decrements inventory in PostgreSQL, reindexes changed products in Aiven OpenSearch, then publishes `SEARCH_SYNCED`.
- Product listing, filters, fuzzy search, and autocomplete query Aiven OpenSearch. Product detail overlays current stock from PostgreSQL.

There are no local database, Kafka, or search fallbacks. Without Aiven credentials the UI shows service setup states and the commerce APIs remain unavailable.

## Aiven Setup

Create Aiven services for PostgreSQL, Apache Kafka, and OpenSearch. Copy `.env.example` to `.env`, then set the connection URI, broker, and credentials from each Aiven service's connection information. Set `KAFKA_SASL_MECHANISM` to the mechanism displayed by Aiven (the default is `SCRAM-SHA-256`). Keep secrets out of source control.

Set `ADMIN_ACCESS_KEY` to a private demo key and `ADMIN_SESSION_SECRET` to a random value of at least 32 characters. The admin session uses a signed, HTTP-only, same-site cookie.

```powershell
npm install
Copy-Item .env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Replace the example environment values before running database migrations or seeding. The seed command writes its 13 sample products to Aiven PostgreSQL and indexes them in Aiven OpenSearch. Kafka topics are created by the API when it connects.

Open `http://localhost:3000` for the storefront and `http://localhost:3000/admin` for operations. The admin page prompts for `ADMIN_ACCESS_KEY`. The API health check at `/api/health` reports the status of each Aiven service.

## Public Deployment (Render)

The `render.yaml` Blueprint runs Next.js and Express together as one public web service. PostgreSQL, Kafka, and OpenSearch remain on Aiven. The checked-in `.gitignore` excludes `.env`, local certificate files, and build output.

1. Push the project to a GitHub repository. Do not commit `.env` or anything under `certs/`.
2. In Render, choose **New + → Blueprint**, connect the repository, and deploy `render.yaml`.
3. Configure these variables on the Render service: `DATABASE_URL`, `KAFKA_BROKERS`, `KAFKA_USERNAME`, `KAFKA_PASSWORD`, `OPENSEARCH_NODE`, `OPENSEARCH_USERNAME`, `OPENSEARCH_PASSWORD`, `ADMIN_ACCESS_KEY`, and `ADMIN_SESSION_SECRET`. The admin session secret must be at least 32 characters. Render also sets `NODE_VERSION`, `NODE_ENV`, `API_PORT`, Kafka TLS defaults, and the OpenSearch index through `render.yaml`.
4. In the Render service's **Environment → Secret Files**, add the Aiven Kafka CA certificate as `kafka-ca.pem`. The Blueprint points `KAFKA_CA_CERT_PATH` to `/etc/secrets/kafka-ca.pem`.
5. After deploy, open the Render service URL. Check `/api/health`; all three services should report `connected`.

The production catalog must contain real product records in PostgreSQL and corresponding documents in OpenSearch; this application does not provide a runtime mock catalog. `npm run db:seed` writes the 13 sample/demo products described above, so do not run it against production unless those demo records are intended. Render's free web service may spin down after inactivity, so the first visit can be slow; select a paid always-on plan if the demo requires warm uptime. If Aiven has a source-IP allowlist enabled, add the Render service's outbound IP addresses before testing.

### Separate Vercel Frontend

When the Next.js frontend is deployed on Vercel and the API runs on Render, add `NEXT_PUBLIC_API_URL` to the Vercel project's environment variables. Set it to the Render service's HTTPS origin only (for example, `https://retailx.onrender.com`, with no `/api` path), then redeploy Vercel. Next.js proxies same-origin `/api/*` requests to that origin so admin cookies remain same-site. Do not put Aiven or admin secrets in Vercel. The Express API does not require `CORS_ORIGIN` for this proxy arrangement; if you expose the API directly to browser clients, configure an explicit CORS allowlist instead of `*`.

The backend secrets belong only in Render. Set `ADMIN_ACCESS_KEY` to a private access key and `ADMIN_SESSION_SECRET` to a random secret of at least 32 characters; never commit either value or expose it as a `NEXT_PUBLIC_` variable. `OPENSEARCH_CA_CERT_PATH` is optional when the provider uses a publicly trusted certificate. Leave `OPENSEARCH_TLS_REJECT_UNAUTHORIZED` enabled in production.

## Demo Flow

1. Search for `bluetoth` to exercise OpenSearch fuzzy matching.
2. Add an item to the PostgreSQL-backed cart and submit checkout.
3. The order and an `ORDER_CREATED` outbox event commit together in PostgreSQL.
4. Kafka publishes the event; its consumer validates and decrements city inventory.
5. `INVENTORY_UPDATED` triggers an OpenSearch reindex and a `SEARCH_SYNCED` event.
6. The order confirmation and protected event monitor display the observed event flow.

## Commands

- `npm run dev` starts Next.js and Express.
- `npm run build` generates Prisma, compiles the API, and builds Next.js.
- `npm run typecheck` checks the TypeScript workspace.
- `npm run db:migrate` applies committed Prisma migrations.
- `npm run db:seed` writes the sample catalog to Aiven services.