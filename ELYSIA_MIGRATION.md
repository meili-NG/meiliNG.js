# Elysia Migration Guide

## Overview

This document outlines the migration from Fastify to Elysia for the meiliNG authentication server. Elysia is a modern, fast, and ergonomic TypeScript framework built for Bun.

## Why Elysia?

- **Performance**: Built on Bun runtime, offering exceptional performance
- **Type Safety**: End-to-end type safety with automatic type inference
- **Modern API**: Clean, intuitive API design with excellent developer experience
- **Schema Validation**: Built-in schema validation with multiple providers
- **OpenAPI**: Automatic OpenAPI/Swagger documentation generation
- **Plugin System**: Powerful plugin architecture similar to Fastify

## Migration Strategy

### Phase 1: Preparation (Current Phase)
- ✅ Analyze current Fastify architecture
- 🔄 Update dependencies
- 🔄 Create Elysia app structure alongside existing Fastify app
- 🔄 Create migration utilities and adapters

### Phase 2: Core Infrastructure
- Migrate error handling system
- Migrate authentication middleware
- Migrate session management
- Create Elysia plugin adapters

### Phase 3: Route Migration
- Migrate root routes
- Migrate `/v1/meiling` routes (user-facing)
- Migrate `/v1/admin` routes
- Migrate `/v1/oauth2` routes
- Migrate `/v1/saml2` routes
- Migrate `/.well-known` routes

### Phase 4: Testing & Validation
- Integration testing
- API compatibility verification
- Performance benchmarking
- Documentation updates

### Phase 5: Deployment
- Update deployment configuration
- Switch from Node.js to Bun runtime
- Production rollout

## Key Differences: Fastify vs Elysia

### 1. Application Initialization

**Fastify:**
```typescript
import Fastify from 'fastify';
const app = Fastify({ logger: true });
```

**Elysia:**
```typescript
import { Elysia } from 'elysia';
const app = new Elysia();
```

### 2. Route Handlers

**Fastify:**
```typescript
app.post('/signin', async (req: FastifyRequest, rep: FastifyReply) => {
  return rep.status(200).send({ token: '...' });
});
```

**Elysia:**
```typescript
app.post('/signin', async ({ body, set }) => {
  set.status = 200;
  return { token: '...' };
});
```

### 3. Request Context

**Fastify:**
```typescript
const { params, query, body, headers } = req;
rep.status(200).send(data);
```

**Elysia:**
```typescript
const { params, query, body, headers, set } = context;
set.status = 200;
return data;
```

### 4. Middleware/Hooks

**Fastify:**
```typescript
app.addHook('onRequest', async (req, rep) => {
  // Middleware logic
});
```

**Elysia:**
```typescript
app.onBeforeHandle(async (context) => {
  // Middleware logic
  return context;
});
```

### 5. Error Handling

**Fastify:**
```typescript
app.setErrorHandler((error, req, rep) => {
  rep.status(500).send({ error: error.message });
});
```

**Elysia:**
```typescript
app.onError(({ code, error, set }) => {
  set.status = 500;
  return { error: error.message };
});
```

### 6. Plugins

**Fastify:**
```typescript
app.register(plugin, { options });
```

**Elysia:**
```typescript
app.use(plugin(options));
```

### 7. Request Decoration

**Fastify:**
```typescript
app.decorateRequest('session', null);
req.session = sessionData;
```

**Elysia:**
```typescript
app.derive(({ request }) => ({
  session: sessionData
}));
```

## Migration Patterns

### Pattern 1: Simple GET Route

**Before (Fastify):**
```typescript
// src/routes/v1/meiling/session.ts
export async function sessionHandler(req: FastifyRequest, rep: FastifyReply) {
  const session = req.session;
  if (!session) {
    throw new MeilingV1Error(MeilingV1ErrorType.UNAUTHORIZED);
  }
  return rep.send({ session });
}

// Registration
app.get('/session', sessionHandler);
```

**After (Elysia):**
```typescript
// src/routes/v1/meiling/session.ts
import { Elysia } from 'elysia';
import { sessionMiddleware } from '../../../middleware/session';

export const sessionRoute = new Elysia()
  .use(sessionMiddleware)
  .get('/session', ({ session }) => {
    if (!session) {
      throw new MeilingV1Error(MeilingV1ErrorType.UNAUTHORIZED);
    }
    return { session };
  });
```

### Pattern 2: POST Route with Body Validation

**Before (Fastify):**
```typescript
export async function signinHandler(req: FastifyRequest, rep: FastifyReply) {
  const { id, password } = req.body as { id: string; password: string };
  // ... logic
  return rep.send({ token });
}
```

**After (Elysia):**
```typescript
import { t } from 'elysia';

export const signinRoute = new Elysia()
  .post('/signin', async ({ body }) => {
    const { id, password } = body;
    // ... logic
    return { token };
  }, {
    body: t.Object({
      id: t.String(),
      password: t.String()
    })
  });
```

### Pattern 3: Plugin Registration

**Before (Fastify):**
```typescript
export default async function meilingRoutes(app: FastifyInstance) {
  app.register(sessionRoutes, { prefix: '/session' });
  app.register(authRoutes, { prefix: '/auth' });
}
```

**After (Elysia):**
```typescript
export const meilingPlugin = new Elysia({ prefix: '/meiling' })
  .use(sessionRoute)
  .use(authRoute);
```

### Pattern 4: Authentication Middleware

**Before (Fastify):**
```typescript
app.addHook('onRequest', async (req, rep) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    throw new Error('Unauthorized');
  }
  req.user = await validateToken(token);
});
```

**After (Elysia):**
```typescript
export const authMiddleware = new Elysia()
  .derive(async ({ request }) => {
    const token = getTokenFromRequest(request);
    if (!token) {
      throw new Error('Unauthorized');
    }
    return {
      user: await validateToken(token)
    };
  });
```

## Dependency Updates

### Remove:
```json
{
  "fastify": "^4.10.2",
  "@fastify/cors": "^8.2.0",
  "@fastify/formbody": "^7.3.0",
  "@fastify/swagger": "^8.1.0",
  "fastify-secure-session": "^2.3.0"
}
```

### Add:
```json
{
  "elysia": "^1.1.0",
  "@elysiajs/cors": "^1.1.0",
  "@elysiajs/swagger": "^1.1.0",
  "@elysiajs/jwt": "^1.1.0"
}
```

### Update Runtime:
- **Current**: Node.js (via `node ./dist/`)
- **New**: Bun (via `bun run ./src/index.ts`)

## Configuration Changes

### 1. TypeScript Configuration

Update `tsconfig.json` for Bun compatibility:

```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "esnext",
    "moduleResolution": "bundler",
    "lib": ["esnext"],
    "types": ["bun-types"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true
  }
}
```

### 2. Package Scripts

Update `package.json` scripts:

```json
{
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "start": "bun src/index.ts",
    "start:prod": "NODE_ENV=production bun src/index.ts",
    "build": "bun build src/index.ts --outdir dist --target bun",
    "test": "bun test"
  }
}
```

## Migration Checklist

### Infrastructure
- [ ] Install Bun runtime
- [ ] Update package.json dependencies
- [ ] Update TypeScript configuration
- [ ] Create Elysia app entry point
- [ ] Set up error handling
- [ ] Set up logging

### Middleware
- [ ] Migrate CORS middleware
- [ ] Migrate session middleware
- [ ] Migrate authentication middleware
- [ ] Migrate Sentry integration
- [ ] Migrate request decorators

### Routes
- [ ] Migrate root routes (/)
- [ ] Migrate /v1/meiling routes
  - [ ] /signin
  - [ ] /signup
  - [ ] /signout
  - [ ] /session
  - [ ] /lost-password
  - [ ] /users
  - [ ] /apps
  - [ ] /authentication
- [ ] Migrate /v1/admin routes
  - [ ] /apps
  - [ ] /auth
  - [ ] /permissions
  - [ ] /sessions
  - [ ] /tokens
  - [ ] /users
- [ ] Migrate /v1/oauth2 routes
- [ ] Migrate /v1/saml2 routes
- [ ] Migrate /.well-known routes

### Testing
- [ ] Unit tests for core utilities
- [ ] Integration tests for API routes
- [ ] Authentication flow tests
- [ ] OAuth2 flow tests
- [ ] SAML2 flow tests
- [ ] Performance benchmarks

### Documentation
- [ ] Update API documentation
- [ ] Update deployment guide
- [ ] Update development setup guide
- [ ] Document breaking changes

## Common Issues & Solutions

### Issue 1: Request Body Parsing

**Problem**: Fastify uses `@fastify/formbody` for form parsing

**Solution**: Elysia has built-in support for JSON and form data

```typescript
// No additional plugins needed
app.post('/form', ({ body }) => body); // Automatically parsed
```

### Issue 2: Session Management

**Problem**: `fastify-secure-session` is Fastify-specific

**Solution**: Use Elysia JWT plugin or custom session middleware

```typescript
import { jwt } from '@elysiajs/jwt';

app.use(
  jwt({
    name: 'jwt',
    secret: process.env.JWT_SECRET!
  })
);
```

### Issue 3: Type Inference

**Problem**: Fastify requires manual type annotations

**Solution**: Elysia provides automatic type inference

```typescript
// Types are automatically inferred from schema
app.post('/user', ({ body }) => body, {
  body: t.Object({
    name: t.String(),
    email: t.String()
  })
});
```

## Performance Considerations

### Expected Improvements:
- **Startup Time**: 3-5x faster with Bun
- **Request Throughput**: 2-3x higher with Elysia on Bun
- **Memory Usage**: 20-30% reduction
- **Type Checking**: Faster with Bun's TypeScript support

### Benchmarking Plan:
1. Baseline Fastify performance
2. Measure Elysia performance
3. Compare critical endpoints (signin, OAuth2 flows)
4. Load testing with realistic scenarios

## Rollback Plan

If issues arise during migration:

1. **Maintain both versions**: Keep Fastify implementation until Elysia is stable
2. **Feature flags**: Use environment variables to toggle between implementations
3. **Gradual migration**: Migrate routes incrementally with proxy layer
4. **Monitoring**: Set up comprehensive monitoring before switching

## Resources

- [Elysia Documentation](https://elysiajs.com)
- [Bun Documentation](https://bun.sh/docs)
- [Migration Examples](./docs/elysia-examples/)
- [API Compatibility Matrix](./docs/api-compatibility.md)

## Timeline

- **Week 1**: Infrastructure setup and core utilities
- **Week 2**: Middleware migration and authentication
- **Week 3**: Route migration (user-facing)
- **Week 4**: Route migration (admin, OAuth2, SAML2)
- **Week 5**: Testing and documentation
- **Week 6**: Staging deployment and validation
- **Week 7**: Production rollout

## Support

For questions or issues during migration:
- Create GitHub issues with `elysia-migration` label
- Refer to this document for patterns
- Check Elysia Discord for community support
