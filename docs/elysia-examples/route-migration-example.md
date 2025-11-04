# Route Migration Examples

This document shows practical examples of migrating routes from Fastify to Elysia.

## Example 1: Simple GET Route (Session)

### Before (Fastify)

```typescript
// src/routes/v1/meiling/session.ts
export function sessionPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.get(
    '/',
    {
      schema: {
        description: 'Issue a new Session token or Verify Session token',
        tags: ['meiling'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (req, rep) => {
      const token = getTokenFromRequest(req);

      if (token) {
        return rep.status(200).send({ success: true });
      } else {
        const newToken = await createToken(req);
        return rep.status(201).send({ success: true, token: newToken });
      }
    }
  );

  done();
}
```

### After (Elysia)

```typescript
// src/routes/v1/meiling/session.elysia.ts
export const sessionPlugin = new Elysia({ prefix: '/session' })
  .use(optionalSessionMiddleware)
  .get(
    '/',
    async ({ request, session, set }) => {
      const token = getTokenFromRequest(request);

      if (token) {
        set.status = 200;
        return { success: true };
      } else {
        const newToken = await createToken(request);
        set.status = 201;
        return { success: true, token: newToken };
      }
    },
    {
      detail: {
        description: 'Issue a new Session token or Verify Session token',
        tags: ['meiling'],
      },
      response: {
        200: t.Object({
          success: t.Literal(true),
        }),
      },
    }
  );
```

## Example 2: POST Route with Body Validation

### Before (Fastify)

```typescript
// src/routes/v1/meiling/signin.ts
app.post(
  '/signin',
  {
    schema: {
      body: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string' },
          password: { type: 'string' },
        },
      },
    },
  },
  async (req: FastifyRequest, rep: FastifyReply) => {
    const { username, password } = req.body as { username: string; password: string };

    const user = await authenticate(username, password);

    return rep.send({
      success: true,
      data: user,
    });
  }
);
```

### After (Elysia)

```typescript
// src/routes/v1/meiling/signin.elysia.ts
export const signinRoute = new Elysia()
  .post(
    '/signin',
    async ({ body }) => {
      const { username, password } = body;

      const user = await authenticate(username, password);

      return {
        success: true,
        data: user,
      };
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
    }
  );
```

## Example 3: Route with Session Middleware

### Before (Fastify)

```typescript
// src/routes/v1/meiling/user.ts
function userPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  // Session middleware applied at plugin level
  app.decorateRequest('session', null);

  app.addHook('onRequest', async (req, rep) => {
    const session = await getSessionFromRequest(req);
    if (!session) {
      throw new Error('Unauthorized');
    }
    req.session = session;
  });

  app.get('/me', async (req: FastifyRequestWithSession, rep) => {
    const userId = req.session.userId;
    const user = await getUser(userId);
    return rep.send(user);
  });

  done();
}
```

### After (Elysia)

```typescript
// src/routes/v1/meiling/user.elysia.ts
export const userPlugin = new Elysia({ prefix: '/users' })
  .use(sessionMiddleware)
  .get('/me', async ({ session }) => {
    const userId = session.userId;
    const user = await getUser(userId);
    return user;
  });
```

## Example 4: Admin Route with Token Auth

### Before (Fastify)

```typescript
// src/routes/v1/admin/users.ts
app.addHook('onRequest', async (req, rep) => {
  const token = getTokenFromRequest(req);
  if (!token || !validateAdminToken(token)) {
    throw new Error('Unauthorized');
  }
});

app.get('/users', async (req, rep) => {
  const users = await getAllUsers();
  return rep.send(users);
});
```

### After (Elysia)

```typescript
// src/routes/v1/admin/users.elysia.ts
export const adminUsersPlugin = new Elysia({ prefix: '/users' })
  .use(adminSessionMiddleware)
  .get('/', async () => {
    const users = await getAllUsers();
    return users;
  });
```

## Example 5: Route with Query Parameters

### Before (Fastify)

```typescript
// src/routes/v1/meiling/apps/list.ts
app.get(
  '/apps',
  {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', default: 1 },
          limit: { type: 'number', default: 20 },
        },
      },
    },
  },
  async (req, rep) => {
    const { page, limit } = req.query as { page: number; limit: number };
    const apps = await getApps(page, limit);
    return rep.send(apps);
  }
);
```

### After (Elysia)

```typescript
// src/routes/v1/meiling/apps/list.elysia.ts
export const appsListRoute = new Elysia()
  .get(
    '/apps',
    async ({ query }) => {
      const { page, limit } = query;
      const apps = await getApps(page, limit);
      return apps;
    },
    {
      query: t.Object({
        page: t.Number({ default: 1, minimum: 1 }),
        limit: t.Number({ default: 20, minimum: 1, maximum: 100 }),
      }),
    }
  );
```

## Example 6: Route with Path Parameters

### Before (Fastify)

```typescript
// src/routes/v1/meiling/apps/get.ts
app.get(
  '/apps/:id',
  {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
    },
  },
  async (req, rep) => {
    const { id } = req.params as { id: string };
    const app = await getApp(id);
    return rep.send(app);
  }
);
```

### After (Elysia)

```typescript
// src/routes/v1/meiling/apps/get.elysia.ts
export const appGetRoute = new Elysia()
  .get(
    '/apps/:id',
    async ({ params }) => {
      const { id } = params;
      const app = await getApp(id);
      return app;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  );
```

## Example 7: Error Handling

### Before (Fastify)

```typescript
app.setErrorHandler((error, req, rep) => {
  if (error instanceof MeilingError) {
    return rep.status(error.statusCode).send({
      success: false,
      error: error.type,
      message: error.message,
    });
  }

  return rep.status(500).send({
    success: false,
    error: 'INTERNAL_ERROR',
  });
});

app.get('/test', async (req, rep) => {
  throw new MeilingError(ErrorType.NOT_FOUND);
});
```

### After (Elysia)

```typescript
// Error handling is done globally in middleware
// Routes just throw errors normally

export const testRoute = new Elysia()
  .get('/test', async () => {
    throw new MeilingError(ErrorType.NOT_FOUND);
  });
```

## Example 8: Plugin Composition

### Before (Fastify)

```typescript
// src/routes/v1/meiling/index.ts
function meilingV1Plugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.register(sessionPlugin, { prefix: '/session' });
  app.register(userPlugin, { prefix: '/users' });
  app.register(appsPlugin, { prefix: '/apps' });

  done();
}
```

### After (Elysia)

```typescript
// src/routes/v1/meiling/index.elysia.ts
export const meilingV1Plugin = new Elysia({ prefix: '/meiling' })
  .use(sessionPlugin)
  .use(userPlugin)
  .use(appsPlugin);
```

## Key Differences Summary

| Feature | Fastify | Elysia |
|---------|---------|--------|
| Plugin Declaration | `function(app, opts, done)` | `new Elysia()` |
| Route Handler | `async (req, rep) => {}` | `async ({ body, params, query, set }) => {}` |
| Response | `rep.status(200).send(data)` | `set.status = 200; return data;` |
| Schema Validation | `schema: { body: { ... } }` | `body: t.Object({ ... })` |
| Middleware | `app.addHook('onRequest', ...)` | `app.derive(...)` or `.use()` |
| Error Handling | `app.setErrorHandler(...)` | `app.onError(...)` |
| Plugin Registration | `app.register(plugin)` | `app.use(plugin)` |

## Migration Checklist for Each Route

- [ ] Replace `FastifyRequest, FastifyReply` with Elysia context destructuring
- [ ] Update `req.body` to `body`, `req.params` to `params`, etc.
- [ ] Replace `rep.send()` with `return`
- [ ] Replace `rep.status(X).send()` with `set.status = X; return`
- [ ] Convert JSON Schema to TypeBox schemas (`t.Object`, etc.)
- [ ] Update middleware from `addHook` to `.derive()` or `.use()`
- [ ] Replace `done()` callback with direct plugin return
- [ ] Update error handling to use global error handler
- [ ] Test route with Elysia app
