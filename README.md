# 🏴 FlagForge

> A production-oriented, multi-tenant feature flag management system built with Node.js, TypeScript, PostgreSQL, Redis, and Express.js — with a published JavaScript/TypeScript SDK and load-tested public flag delivery API.

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](#)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)](#)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)](#)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)](#)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](#)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat)](#)

**FlagForge** is a backend-focused feature flag platform designed around the problems that appear when a simple CRUD API becomes a runtime infrastructure service.

It supports multi-tenant organizations, isolated environments, secure API-key authentication, runtime flag delivery, audit logging, role-based access control, Redis caching, and a JavaScript/TypeScript SDK for consuming feature flags.

The project also includes load testing with **k6** to evaluate throughput, latency, and behavior under increasing concurrent load.

---

## 💡 Why I Built This

Feature flags look simple at first:

```text
Is `new_checkout` enabled?
```

But a production system needs to answer several additional questions:

- Who is allowed to modify a flag?
- Which organization owns it?
- What value should it have in development vs production?
- How can applications retrieve flags securely at runtime?
- How do we avoid querying PostgreSQL on every request?
- What happens when cached configuration becomes stale?
- How should API keys be stored?
- How does the system behave under high concurrency?

FlagForge was built to explore these backend engineering problems rather than simply implement CRUD endpoints.

---

## 🏗️ Architecture

<!-- ARCHITECTURE DIAGRAM PLACEHOLDER -->
<!-- Replace the following placeholder with your exported Excalidraw architecture diagram. -->

![FlagForge System Architecture](./docs/architecture.png)

### High-Level Request Flow

```text
                    ┌──────────────────────┐
                    │   Client Application │
                    │   / FlagForge SDK    │
                    └──────────┬───────────┘
                               │
                               │ API Key
                               ▼
                    ┌──────────────────────┐
                    │     Express API      │
                    │                      │
                    │ Validation            │
                    │ Authentication       │
                    │ RBAC                 │
                    │ Rate Limiting        │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │   Public Flag API    │
                    └──────────┬───────────┘
                               │
                         Cache-Aside
                               │
                    ┌──────────▼───────────┐
                    │        Redis         │
                    │                      │
                    │ API Key Cache        │
                    │ Flag Configuration   │
                    └──────────┬───────────┘
                               │ Cache Miss
                               ▼
                    ┌──────────────────────┐
                    │     PostgreSQL       │
                    │                      │
                    │ Organizations        │
                    │ Users                │
                    │ Environments         │
                    │ Feature Flags        │
                    │ API Keys             │
                    │ Audit Logs           │
                    └──────────────────────┘
```

---

## 🌟 Core Features

### Multi-Tenant Organizations

- Organization-level resource isolation
- User membership and roles
- Environment ownership scoped to organizations

### Environment-Specific Flags

A single feature flag can have different values across environments.

```text
enable_new_dashboard

Development  → true
Staging      → true
Production   → false
```

This allows teams to deploy application code independently from feature activation.

### Runtime Flag Delivery

Applications can retrieve:

- All flags
- Individual flags
- Multiple flags in a single request
- Boolean flag evaluation

### API Key Authentication

Runtime clients authenticate using environment-scoped API keys.

API keys are:

1. Validated for format
2. Hashed using SHA-256
3. Looked up against the database
4. Cached in Redis after a successful lookup

The raw API key is not stored in the database.

### Role-Based Access Control

**ADMIN**

- Manage feature flags
- Modify environment values
- Manage API keys
- Manage users
- Manage environments
- View audit logs

**MEMBER**

- Read feature configuration
- View environments
- View permitted audit information

---

# 🚀 Performance & Scalability

Performance was treated as an engineering concern rather than an afterthought.

The public flag-delivery path uses a **Redis cache-aside strategy** to avoid repeatedly querying PostgreSQL for frequently accessed configuration.

### Cache Strategy

```text
Request
   │
   ▼
Redis GET
   │
   ├── HIT ───────────────► Return cached flag
   │
   └── MISS
        │
        ▼
   PostgreSQL
        │
        ▼
   Store in Redis
        │
        ▼
   Return response
```

Cached data uses a **5-minute TTL** with targeted invalidation when relevant flag or environment data changes.

This provides a balance between:

- Low read latency
- Reduced PostgreSQL load
- Controlled cache staleness
- Explicit consistency handling

---

## 🔑 API Key Caching

API-key authentication initially required a database lookup for every request.

The authentication path was changed to:

```text
Incoming Request
       │
       ▼
Validate API Key
       │
       ▼
SHA-256 Hash
       │
       ▼
Redis GET
       │
       ├── HIT ───────► Authenticate request
       │
       └── MISS
              │
              ▼
          PostgreSQL
              │
              ▼
          Redis SET
              │
              ▼
          Continue
```

This moves repeated authentication lookups away from PostgreSQL and allows subsequent requests using the same API key to authenticate through Redis.

---

# 📈 Load Testing

Load testing was performed using **k6** with the public flag endpoint.

### Test configuration

```text
Tool:        k6
Endpoint:    GET /api/v1/public/flags
Duration:    30 seconds
Load model:  Constant VUs
Validation:  HTTP 200 response
```

## Local Scalability Results

These tests were executed against the local development environment.

| Concurrent VUs | Requests/sec | Avg Latency | p95 Latency | HTTP Failures |
| -------------: | -----------: | ----------: | ----------: | ------------: |
|             10 |       285.62 |     34.8 ms |    47.87 ms |            0% |
|             50 |       366.49 |   136.05 ms |   198.26 ms |            0% |
|            100 |       265.88 |   374.95 ms |   360.75 ms |            0% |
|            200 |       300.74 |   660.78 ms |   855.71 ms |            0% |
|            500 |       401.64 |      1.21 s |   692.44 ms |            0% |
|          1,000 | **1,025.75** |   899.42 ms |      1.28 s |        **0%** |
|          1,500 |       759.61 |      1.16 s |      2.41 s |        **0%** |

### 1,000 VU result

The strongest repeatable benchmark from the latest test:

```text
Virtual Users:     1,000
Duration:          30 seconds
Requests:          32,361
Throughput:        1,025.75 req/s
Average latency:   899.42 ms
p95 latency:       1.28 s
HTTP failures:     0%
```

### 1,500 VU result

Increasing concurrency further produced:

```text
Virtual Users:     1,500
Duration:          30 seconds
Requests:          23,708
Throughput:        759.61 req/s
Average latency:   1.16 s
p95 latency:       2.41 s
HTTP failures:     0%
```

The decrease in throughput at 1,500 VUs indicates that the tested environment was reaching a saturation point.

**Important:** these results demonstrate the behavior of the tested deployment/environment. They should not be interpreted as proof that the application can support exactly 1,000 or 1,500 real-world users. CPU, memory, database, Redis, network, and connection-pool metrics were not collected simultaneously, so the exact saturation bottleneck is not attributed to a single component.

---

## Production Benchmark

A separate production deployment was also tested to understand the behavior of the deployed system.

### Production — 1,000 VUs

```text
Virtual Users:     1,000
Duration:          30 seconds
Requests:          40,150
Throughput:        1,303 req/s
Average latency:   592.97 ms
p95 latency:       1.04 s
HTTP failures:     0%
```

These numbers should be viewed independently from the local benchmarks because the two environments have different compute resources, network paths, infrastructure, and database/Redis topology.

---

## Benchmarking Philosophy

The project deliberately separates three different measurements:

### 1. Cache Optimization

Measures the architectural improvement from moving repeated reads away from PostgreSQL and into Redis.

### 2. Local Scalability

Measures how the application behaves as concurrency increases on a developer machine.

### 3. Production Scalability

Measures behavior of the deployed service under cloud infrastructure constraints.

This avoids presenting local and cloud latency as if they were directly comparable.

---

# 🔴 Redis Diagnostics

Redis performance was also measured independently from the full HTTP request path.

Example local measurements:

```text
Baseline Redis socket latency: ~2.52 ms
Redis SET:                    ~4.4 ms
Redis GET:                    ~1.3–1.5 ms
JSON parsing:                 ~0.004 ms
```

The production deployment using Railway's internal Redis networking showed substantially higher Redis network latency.

This was treated as an **infrastructure/network characteristic of the deployment topology**, rather than being incorrectly attributed to Redis command execution itself.

---

# 🛠️ Technology Stack

| Layer            | Technology              |
| ---------------- | ----------------------- |
| Runtime          | Node.js                 |
| Language         | TypeScript              |
| Framework        | Express.js              |
| ORM              | Prisma                  |
| Primary Database | PostgreSQL              |
| Cache            | Redis                   |
| Authentication   | JWT + API Keys          |
| Validation       | Zod                     |
| Security         | Helmet, CORS, bcrypt    |
| Containerization | Docker                  |
| Load Testing     | k6                      |
| API Testing      | Postman                 |
| Deployment       | Vercel / Railway        |
| SDK              | JavaScript / TypeScript |

---

# 📚 API Overview

Base path:

```text
/api/v1
```

## Authentication

```text
POST /api/v1/user/register
POST /api/v1/user/login
POST /api/v1/user/refresh
```

## Feature Flags

```text
GET    /api/v1/flags
GET    /api/v1/flags/:id
POST   /api/v1/flags
PUT    /api/v1/flags/:id
DELETE /api/v1/flags/:id
```

Environment-specific flag operations are exposed through the flag/environment APIs.

## API Keys

```text
GET  /api/v1/api-keys
POST /api/v1/api-keys
POST /api/v1/api-keys/:id/revoke
```

## Public Runtime API

Public endpoints use an environment-scoped API key.

```http
X-API-Key: sk_prod_xxxxxxxxx
```

### Get all flags

```http
GET /api/v1/public/flags
```

Example:

```json
{
  "statusCode": 200,
  "data": {
    "flags": {
      "enable_new_feature": true,
      "api_rate_limit": 1000,
      "welcome_message": "Hello, user!"
    },
    "environment": "prod"
  },
  "message": "Flags retrieved successfully"
}
```

### Get a single flag

```http
GET /api/v1/public/flags/:key
```

### Bulk flag retrieval

```http
POST /api/v1/public/flags/bulk
```

```json
{
  "keys": ["enable_new_feature", "api_rate_limit", "welcome_message"]
}
```

### Boolean flag check

```http
GET /api/v1/public/flags/:key/enabled
```

---

# 📦 SDK

FlagForge also includes a JavaScript/TypeScript SDK for consuming feature flags from applications.

### Installation

```bash
npm i @flagforge-ff/sdk
```

The SDK is published independently on npm.

**SDK:** [[NPM_PACKAGE_URL](https://www.npmjs.com/package/@flagforge-ff/sdk)]

Example:

```typescript
import { FlagForgeClient } from "@flagforge/sdk-js";

const client = new FlagForgeClient({
  // SDK configuration
});

await client.init();

const enabled = await client.getBooleanValue("new-checkout", false);
```

The SDK is designed to move flag consumption away from application-specific HTTP calls and provide a reusable client interface.

---

# 🗄️ Database Model

The core data model consists of:

```text
Organization
    │
    ├── Users
    │
    ├── Environments
    │       │
    │       └── API Keys
    │
    ├── Feature Flags
    │       │
    │       └── Environment Values
    │
    └── Audit Logs

Users
    │
    └── Refresh Tokens
```

### Main entities

- `Organization`
- `User`
- `Environment`
- `FeatureFlag`
- `FlagEnvironmentValue`
- `ApiKey`
- `AuditLog`
- `RefreshToken`

See [`prisma/schema.prisma`](./prisma/schema.prisma) for the complete schema.

---

# 🔐 Security

The system implements several security controls:

- Password hashing with bcrypt
- SHA-256 hashing for stored API keys
- JWT-based authentication
- Access and refresh token model
- Role-based authorization
- API key validation
- Request validation using Zod
- Helmet security headers
- CORS configuration
- Rate limiting
- Prisma parameterized database access
- Environment-specific API keys

### API Key Storage

Raw API keys are never persisted directly.

```text
Raw API Key
     │
     ▼
SHA-256
     │
     ▼
Hashed Key
     │
     ▼
PostgreSQL
```

The client receives the raw key when it is created and is responsible for storing it securely.

---

# 📂 Project Structure

```text
src/
├── config/
│   ├── logger.ts
│   └── redis.ts
│
├── controllers/
│   ├── auth.controller.ts
│   ├── flag.controller.ts
│   ├── apiKey.controller.ts
│   └── public.controller.ts
│
├── middlewares/
│   ├── auth.middleware.ts
│   ├── rbac.middleware.ts
│   ├── apiKeyAuth.middleware.ts
│   ├── validateRequest.middleware.ts
│   ├── rateLimit.middleware.ts
│   └── errorHandler.middleware.ts
│
├── routes/
├── services/
├── validators/
├── utils/
├── types/
│
├── app.ts
└── index.ts

prisma/
└── schema.prisma

load-test/
└── public-flag.js
```

---

# Running Locally

## Prerequisites

- Node.js 22+
- PostgreSQL
- Redis
- Docker (optional)
- npm

## Installation

```bash
git clone <REPOSITORY_URL>

cd <PROJECT_DIRECTORY>

npm install
```

## Environment Variables

Create `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/feature_flags"

REDIS_URL="redis://localhost:6379"

ACCESS_TOKEN_SECRET="your-access-token-secret"
REFRESH_TOKEN_SECRET="your-refresh-token-secret"

CORS_ORIGIN="http://localhost:3000"

PORT=8000
NODE_ENV=development
```

## Prisma

```bash
npm run prisma:generate
npm run prisma:migrate
```

Optional:

```bash
npm run prisma:seed
npm run prisma:studio
```

## Development

```bash
npm run dev
```

## Production Build

```bash
npm run build
npm start
```

---

# 🐳 Docker

The application can be containerized to provide a consistent runtime environment across development and deployment.

Example:

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 8000

CMD ["npm", "start"]
```

Docker was primarily used to make the application environment reproducible and simplify deployment between local and cloud environments.

---

# 🧪 Load Testing with k6

Example:

```bash
k6 run load-test/public-flag.js
```

The load test validates:

- HTTP status
- Request throughput
- Request latency
- Failure rate
- Behavior under increasing concurrency

For reproducibility, benchmark results should always be reported together with:

```text
Environment
VUs
Duration
Endpoint
Requests
Throughput
Average latency
p95 latency
Failure rate
```

---

# 🧩 Engineering Decisions

### Why PostgreSQL?

Feature flags have relationships between organizations, environments, users, API keys, and audit logs. PostgreSQL provides strong relational integrity and transactional guarantees for these relationships.

### Why Redis?

Flag configuration and API-key metadata are read much more frequently than they are modified.

Redis provides a fast cache layer for these hot read paths.

### Why Cache-Aside?

The application controls when data is loaded and cached:

```text
Read → Cache
       │
       ├── Hit → Return
       │
       └── Miss → PostgreSQL → Cache → Return
```

This keeps PostgreSQL as the source of truth while allowing Redis to accelerate repeated reads.

### Why Targeted Cache Invalidation?

Cached flag data becomes stale when the underlying configuration changes.

Instead of deleting unrelated keys, the application invalidates only the affected environment/flag cache entries where their identifiers are known.

This reduces unnecessary cache operations and keeps the invalidation logic explicit.

---

# 🎓 What I Learned

This project evolved beyond implementing REST endpoints into an exploration of backend engineering concerns including:

- Multi-tenant data modeling
- Authentication vs authorization
- API key lifecycle management
- Cache-aside architecture
- Cache invalidation
- Redis connection behavior
- Database access patterns
- API performance measurement
- Concurrent load testing
- Dockerized deployment
- Cloud infrastructure behavior
- SDK design and package publishing
- Separating application bottlenecks from infrastructure bottlenecks

The load-testing process was particularly useful because higher concurrency did not simply produce proportionally higher throughput. At some point the tested environment reached saturation, demonstrating why scalability claims need to be backed by measurements rather than assumptions.

---

# 🗺️ Roadmap

Potential future improvements:

- [ ] Automated unit and integration test suite
- [ ] Distributed rate limiting with Redis
- [ ] Background processing for API-key usage metrics
- [ ] More advanced flag targeting rules
- [ ] Percentage-based rollouts
- [ ] Scheduled flag activation
- [ ] Webhooks for configuration changes
- [ ] Server-Sent Events for real-time flag updates
- [ ] Observability dashboards for latency and cache hit rate
- [ ] Automated performance regression tests
- [ ] Additional SDKs

---

# 📖 Documentation

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — Detailed system architecture
- [`IMPLEMENTATION_GUIDE.md`](./IMPLEMENTATION_GUIDE.md) — Implementation notes
- [`prisma/schema.prisma`](./prisma/schema.prisma) — Database schema
- `[SDK Documentation](SDK_DOCUMENTATION_URL)` — SDK usage and API

---

# 📄 License

MIT

---

## 👤 Author

**Bashir Ahmed Mondal**

Backend-focused software engineer interested in distributed systems, API design, caching, databases, and cloud infrastructure.

- GitHub: [[GITHUB_PROFILE_URL](https://github.com/Bashirofficial)]
- LinkedIn: [[LINKEDIN_PROFILE_URL](https://www.linkedin.com/in/bashirofficial/)]

---

> **FlagForge is a portfolio project built to explore production-oriented backend engineering concepts. Benchmark results represent the specific environments and configurations under which they were measured and should not be interpreted as universal capacity guarantees.**
