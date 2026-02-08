# Feature Flag Management System - Backend

A production-ready backend for managing feature flags with role-based access control (RBAC), built with Node.js, TypeScript, Express, and Prisma.

## 🌟 Features

### Core Functionality
- ✅ **Feature Flag Management**: Create, read, update, delete flags
- ✅ **Environment-Specific Values**: Different values per environment (dev, staging, prod)
- ✅ **Runtime Flag Delivery**: Public API for client applications to fetch flags
- ✅ **API Key Management**: Generate and revoke API keys for secure access
- ✅ **Audit Logging**: Track all changes with detailed audit trails
- ✅ **Role-Based Access Control**: Admin (full access) vs Member (read-only)

### Security
- 🔐 JWT authentication with refresh tokens
- 🔑 Hashed API keys (SHA-256)
- 🔒 Password hashing (bcrypt)
- 🚦 Rate limiting on auth and public endpoints
- ✔️ Request validation with Zod
- 🛡️ Security headers with Helmet
- 🌐 CORS configuration

### Architecture
- 📁 Clean folder structure following best practices
- 🎯 Controller → Service → Repository pattern
- 🔧 Middleware for auth, RBAC, validation, and error handling
- 🗄️ Prisma ORM for type-safe database access
- 📝 Comprehensive TypeScript types

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd backend-architecture
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/feature_flags"
ACCESS_TOKEN_SECRET="your-super-secret-access-key"
REFRESH_TOKEN_SECRET="your-super-secret-refresh-key"
CORS_ORIGIN="http://localhost:3000"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Seed sample data
npm run prisma:seed

# (Optional) Open Prisma Studio
npm run prisma:studio
```

### 4. Start Server

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

Server runs on `http://localhost:3001`

## 📚 API Documentation

### Authentication Flow

#### 1. Register Organization
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "admin@company.com",
  "password": "SecurePass123!",
  "organizationName": "Acme Corp",
  "firstName": "John",
  "lastName": "Doe"
}
```

Returns:
- User object
- Access token (15 min expiry)
- Refresh token (7 day expiry)
- Creates default environments (dev, staging, prod)

#### 2. Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@company.com",
  "password": "SecurePass123!"
}
```

#### 3. Refresh Access Token
```bash
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

### Admin API (Requires JWT)

All admin endpoints require:
```
Authorization: Bearer <access_token>
```

#### Feature Flags

**List All Flags**
```bash
GET /api/flags
```

**Get Flag Details**
```bash
GET /api/flags/:id
```

**Create Flag** (ADMIN only)
```bash
POST /api/flags
Content-Type: application/json

{
  "key": "enable_new_feature",
  "description": "Enable the new dashboard feature",
  "type": "BOOLEAN",
  "defaultValue": false
}
```

**Update Flag Value** (ADMIN only)
```bash
PUT /api/flags/:id/environments/:envId
Content-Type: application/json

{
  "value": true
}
```

**Delete Flag** (ADMIN only)
```bash
DELETE /api/flags/:id
```

#### API Keys

**List API Keys**
```bash
GET /api/api-keys
```

**Create API Key** (ADMIN only)
```bash
POST /api/api-keys
Content-Type: application/json

{
  "environmentId": "env-id-here",
  "name": "Production Key"
}
```

Returns the API key **once** - store it securely!

**Revoke API Key** (ADMIN only)
```bash
POST /api/api-keys/:id/revoke
```

### Public API (Requires API Key)

All public endpoints require:
```
X-API-Key: sk_prod_your_api_key_here
```

**Get All Flags for Environment**
```bash
GET /api/public/flags
X-API-Key: sk_prod_xxx
```

Returns:
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

**Get Single Flag**
```bash
GET /api/public/flags/:key
X-API-Key: sk_prod_xxx
```

**Get Multiple Flags (Bulk)**
```bash
POST /api/public/flags/bulk
X-API-Key: sk_prod_xxx
Content-Type: application/json

{
  "keys": ["flag1", "flag2", "flag3"]
}
```

**Check If Boolean Flag Is Enabled**
```bash
GET /api/public/flags/:key/enabled
X-API-Key: sk_prod_xxx
```

Returns:
```json
{
  "data": {
    "key": "enable_new_feature",
    "enabled": true
  }
}
```

## 🏗️ Project Structure

```
src/
├── config/              # Configuration files
├── controllers/         # Request handlers
│   ├── auth.controller.ts
│   ├── flag.controller.ts
│   ├── apiKey.controller.ts
│   └── public.controller.ts
├── middlewares/         # Express middlewares
│   ├── auth.middleware.ts
│   ├── rbac.middleware.ts
│   ├── apiKeyAuth.middleware.ts
│   ├── validateRequest.middleware.ts
│   ├── errorHandler.middleware.ts
│   └── rateLimit.middleware.ts
├── routes/              # Route definitions
├── services/            # Business logic
├── validators/          # Zod schemas
├── utils/               # Utility functions
│   ├── ApiError.ts
│   ├── ApiResponse.ts
│   ├── AsyncHandler.ts
│   ├── jwt.util.ts
│   ├── hash.util.ts
│   └── apiKey.util.ts
├── types/               # TypeScript types
├── app.ts               # Express app setup
└── server.ts            # Server entry point

prisma/
└── schema.prisma        # Database schema
```

## 🔐 Security Best Practices

### Implemented
- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ API keys hashed with SHA-256
- ✅ JWT tokens with short expiry
- ✅ Refresh token rotation
- ✅ RBAC on all protected routes
- ✅ Rate limiting (5 req/15min for auth, 1000 req/hour for public API)
- ✅ Input validation with Zod
- ✅ SQL injection protection (Prisma)
- ✅ CORS whitelisting
- ✅ Security headers (Helmet)

### Recommended
- 🔲 Enable HTTPS in production
- 🔲 Use environment-specific secrets
- 🔲 Implement API key rotation
- 🔲 Add IP whitelisting for admin API
- 🔲 Enable audit log retention policies
- 🔲 Add 2FA for admin accounts

## 🎭 Role-Based Access Control (RBAC)

### ADMIN Role
Full access to all operations:
- Create, update, delete flags
- Change flag values in all environments
- Generate and revoke API keys
- Invite and manage users
- View audit logs
- Manage environments

### MEMBER Role
Read-only access:
- View flags
- View environments
- View audit logs
- **Cannot** create/update/delete flags
- **Cannot** manage API keys or users

## 📊 Database Schema

### Key Models
- **User**: Admin and member accounts
- **Organization**: Tenant/workspace
- **Environment**: dev, staging, prod, etc.
- **FeatureFlag**: Flag definitions
- **FlagEnvironmentValue**: Per-environment flag values
- **ApiKey**: Hashed API keys for runtime access
- **AuditLog**: Change tracking
- **RefreshToken**: JWT refresh tokens

See `prisma/schema.prisma` for complete schema.

## 🧪 Testing

### Manual Testing
```bash
# Use Prisma Studio
npm run prisma:studio

# Test with curl
curl http://localhost:3001/health

# Use Postman/Insomnia/Thunder Client
# Import the provided collection
```

### Automated Testing (To Implement)
```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

## 📦 Deployment

### Environment Variables in Production
```bash
# Generate strong secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Build
```bash
npm run build
```

### Run Production Server
```bash
NODE_ENV=production npm start
```

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check DATABASE_URL in .env
# Verify PostgreSQL is running
psql -U your_user -d feature_flags -c "SELECT version();"
```

### Prisma Client Not Generated
```bash
npm run prisma:generate
```

### Port Already in Use
```bash
# Change PORT in .env
PORT=3002
```

## 📝 Additional Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture overview
- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Detailed implementation guide
- [Prisma Docs](https://www.prisma.io/docs)

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/add-webhooks`
2. Follow existing code patterns
3. Add tests for new features
4. Update documentation
5. Submit pull request

## 📄 License

MIT

## 🙋 Support

For issues and questions:
- Check [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)
- Review [ARCHITECTURE.md](./ARCHITECTURE.md)
- Open an issue on GitHub

---
 
