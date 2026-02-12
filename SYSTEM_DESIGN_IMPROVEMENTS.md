# System Design Improvement Proposals

This document outlines pragmatic system-design upgrades for Blogsy based on the current architecture (React SPA + Express API + MongoDB + Redis + Cloudinary).

## 1) API Gateway + Service Boundaries

**Current state:** A single backend service handles auth, users, posts, comments, uploads, and search concerns.

**Recommendation:** Keep the modular monolith for now, but define explicit internal domains and interfaces first:
- Auth & identity
- Content (posts + drafts)
- Engagement (comments + likes)
- Media
- Search/read model

When scale increases, peel off high-churn or compute-heavy modules (search, media processing) into independent services behind an API gateway.

**Benefits:** Better team ownership, safer deploys, and easier horizontal scaling.

---

## 2) Read/Write Separation for Feed and Search (CQRS-lite)

**Current state:** Read endpoints compose data directly from MongoDB with runtime populate and filtering.

**Recommendation:**
- Keep writes in the primary Mongo collections.
- Build dedicated read models for:
  - Home feed
  - Author profile feed
  - Search index
- Update read models asynchronously via events.

**Benefits:** Lower P95/P99 latency for list and search endpoints, fewer expensive query patterns, cleaner scaling path.

---

## 3) Event-Driven Background Work

**Current state:** Some expensive tasks happen inline during request processing (media operations, cache clear patterns).

**Recommendation:** Add a queue (BullMQ/SQS/RabbitMQ) for:
- Media post-processing and retry
- Search indexing updates
- Notification fan-out
- Analytics/event ingestion
- Cache warming tasks

Use the outbox pattern to publish events reliably after DB commits.

**Benefits:** Faster API responses, resilient retries, and better failure isolation.

---

## 4) Caching Strategy Upgrade

**Current state:** Redis key-based caching and wildcard invalidation are used.

**Recommendation:**
- Define cache layers:
  - L1: CDN/edge for public GETs
  - L2: Redis for API read models
- Replace broad wildcard clears with versioned keys/tag-based invalidation.
- Add stale-while-revalidate for hot read endpoints.
- Add cache hit/miss metrics per endpoint.

**Benefits:** Higher cache hit ratio, reduced invalidation storms, more predictable latency.

---

## 5) Data Model and Query Hardening

**Recommendation:**
- Introduce explicit compound indexes for high-traffic patterns (status + createdAt, authorId + status + updatedAt, tags + createdAt).
- For likes/comments counters, use precomputed counters or periodic aggregation to avoid expensive runtime joins.
- Consider soft deletes + TTL/archive strategy for old drafts/logs.

**Benefits:** Better query performance and lower operational risk as data grows.

---

## 6) Search Architecture

**Current state:** Search combines text search and author matching at request time.

**Recommendation:**
- Move to dedicated search infra for scale (Atlas Search/OpenSearch/Meilisearch).
- Maintain indexed searchable documents with ranking fields (recency, engagement).
- Add typo tolerance, synonyms, and language analyzers when needed.

**Benefits:** Better relevance, ranking control, and scalable query throughput.

---

## 7) Media and Asset Delivery

**Recommendation:**
- Keep Cloudinary for media storage/transformations, but front all public media and frontend static assets through CDN.
- Use signed upload policies and strict MIME/size guards.
- Add async moderation/security scanning hooks for uploads.

**Benefits:** Lower bandwidth cost, faster global delivery, safer upload pipeline.

---

## 8) Security and Identity Evolution

**Recommendation:**
- Introduce refresh token rotation with revocation list.
- Add fine-grained authorization policies (RBAC/ABAC for admin/moderation actions).
- Add rate limits per route class and WAF in front of public APIs.
- Centralize secret management and key rotation.

**Benefits:** Reduced auth abuse risk and stronger compliance posture.

---

## 9) Reliability and Scalability

**Recommendation:**
- Run multiple stateless backend instances behind load balancing.
- Define SLOs and error budgets for critical user journeys.
- Add graceful degradation paths (serve cached feed when search fails, etc.).
- Add idempotency keys for write endpoints susceptible to retries.

**Benefits:** Higher availability and safer scaling during traffic spikes.

---

## 10) Observability and Operations

**Recommendation:**
- Structured logging with correlation/request IDs.
- Metrics: latency, throughput, error rates, queue depth, cache hit ratio.
- Distributed tracing across API, DB, cache, queue, and external services.
- Alerting tied to SLO burn rates rather than raw CPU/memory only.

**Benefits:** Faster incident response and data-driven capacity planning.

---

## Suggested Implementation Roadmap

### Phase 1 (1–2 sprints)
- Add observability baseline (logs, metrics, tracing).
- Add explicit indexes and query audits.
- Introduce versioned cache keys and endpoint cache metrics.

### Phase 2 (2–4 sprints)
- Add queue + outbox for background jobs.
- Build read-model pipeline for feed/search.
- Add rate limiting, token rotation, and idempotency keys.

### Phase 3 (longer term)
- Introduce dedicated search service.
- Split high-load domains into separate deployable services if needed.
- Add multi-region read scaling and advanced DR strategy.

---

## Architecture Decision Records (ADR) to Add

Create ADRs before implementation for:
1. Queue technology choice
2. Search engine choice
3. Cache invalidation strategy
4. Token/session management model
5. Service decomposition criteria

This keeps design changes intentional and reviewable as the platform evolves.
