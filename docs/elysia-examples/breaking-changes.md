# Breaking Changes and Compatibility Notes

This document outlines potential breaking changes and compatibility considerations when migrating from Fastify to Elysia.

## Runtime Changes

### Node.js → Bun

**Breaking Change:** The application will run on Bun instead of Node.js.

**Impact:**
- Bun is not 100% compatible with Node.js
- Some Node.js-specific features may not work
- Native modules may need recompilation
- Different performance characteristics

**Mitigation:**
- Test all functionality thoroughly
- Keep Fastify version running in parallel during transition
- Document any incompatibilities found
- Have rollback plan ready

**Known Issues:**
- Some npm packages may not work with Bun
- Native Node.js addons require Bun-compatible builds

## Dependency Changes

### Removed Dependencies
- `fastify` (replaced with `elysia`)
- `@fastify/cors` (replaced with `@elysiajs/cors`)
- `@fastify/formbody` (built into Elysia)
- `@fastify/swagger` (replaced with `@elysiajs/swagger`)
- `fastify-secure-session` (replaced with custom session handling)

### Added Dependencies
- `elysia` - Core framework
- `@elysiajs/cors` - CORS support
- `@elysiajs/swagger` - API documentation
- `@elysiajs/jwt` - JWT handling
- `bun-types` - TypeScript types for Bun

### Updated Dependencies
None (all other dependencies remain the same)

## API Changes

### Request/Response Interface

**Before (Fastify):**
```typescript
async function handler(req: FastifyRequest, rep: FastifyReply) {
  const { id } = req.params;
  const { name } = req.body;
  return rep.status(200).send({ id, name });
}
```

**After (Elysia):**
```typescript
async function handler({ params, body, set }) {
  const { id } = params;
  const { name } = body;
  set.status = 200;
  return { id, name };
}
```

**Impact:** Internal route handlers change, but external API remains identical.

**Mitigation:** No client-side changes needed. Only server code needs updating.

### Schema Validation

**Before (Fastify - JSON Schema):**
```typescript
{
  schema: {
    body: {
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string', format: 'email' }
      }
    }
  }
}
```

**After (Elysia - TypeBox):**
```typescript
{
  body: t.Object({
    email: t.String({ format: 'email' })
  })
}
```

**Impact:** Schema definitions change internally, but validation behavior is identical.

**Mitigation:** No client-side changes needed. Same validation rules apply.

### Plugin System

**Before (Fastify):**
```typescript
function myPlugin(app, opts, done) {
  app.get('/route', handler);
  done();
}

app.register(myPlugin, { prefix: '/v1' });
```

**After (Elysia):**
```typescript
const myPlugin = new Elysia({ prefix: '/v1' })
  .get('/route', handler);

app.use(myPlugin);
```

**Impact:** Internal plugin architecture changes.

**Mitigation:** No external impact. All routes remain at same paths.

## Configuration Changes

### Environment Variables

**No Breaking Changes:** All existing environment variables remain the same.

### Configuration File

**No Breaking Changes:** `config.json` format remains unchanged.

### TypeScript Configuration

**Change:** New `tsconfig.elysia.json` for Elysia-specific builds.

**Impact:**
- Build process may change
- Type checking may be stricter

**Mitigation:**
- Keep original `tsconfig.json` for backwards compatibility
- Use `tsconfig.elysia.json` for Elysia builds

## Logging Changes

### Log Format

**Potential Change:** Bun's built-in logger vs. Pino

**Before:**
```
[2024-01-01 12:00:00] INFO: Server listening on port 3000
```

**After:**
May vary depending on Bun's logging format.

**Impact:** Log parsing tools may need updates.

**Mitigation:**
- Document new log format
- Update log aggregation tools
- Consider keeping Pino for consistent logging

## Session Management

### Session Storage

**No Breaking Changes:** Session storage mechanism remains identical.

### Session Tokens

**No Breaking Changes:** Session token format and validation unchanged.

### Session Headers

**No Breaking Changes:** All session headers remain supported:
- `Authorization: Bearer <token>`
- `X-Meiling-Session: <token>`
- `Cookie: meiling_session=<token>`

## Error Handling

### Error Format

**No Breaking Changes:** Error response format remains identical.

**Before and After:**
```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "type": "UNAUTHORIZED",
  "message": "Invalid credentials"
}
```

### HTTP Status Codes

**No Breaking Changes:** All HTTP status codes remain the same.

### Error Types

**No Breaking Changes:** All `MeilingV1Error` types remain identical.

## Security Considerations

### CORS Configuration

**No Breaking Changes:** CORS behavior remains identical.

### Security Headers

**Potential Change:** Elysia may set different default headers.

**Impact:** Security scanners may report differences.

**Mitigation:**
- Explicitly set all required security headers
- Test with security scanning tools
- Compare headers between Fastify and Elysia versions

### Rate Limiting

**Status:** Not yet implemented in Elysia version.

**Impact:** Rate limiting behavior may differ initially.

**Mitigation:**
- Implement rate limiting plugin for Elysia
- Ensure same rate limits as Fastify version

## Performance Considerations

### Expected Improvements

1. **Startup Time:** 3-5x faster with Bun
2. **Request Throughput:** 2-3x improvement
3. **Memory Usage:** 20-30% reduction
4. **Response Times:** 10-20% improvement

### Potential Regressions

1. **Cold Start:** Bun's JIT may have different cold start characteristics
2. **Database Queries:** Prisma performance on Bun may vary
3. **External HTTP Calls:** axios behavior on Bun may differ

### Benchmarking Required

- [ ] Baseline Fastify performance
- [ ] Measure Elysia performance
- [ ] Compare critical endpoints
- [ ] Load testing scenarios
- [ ] Memory leak testing

## Database Compatibility

### Prisma Client

**No Breaking Changes:** Prisma client works identically on Bun.

### Connection Pooling

**Potential Change:** Connection pool behavior may differ slightly on Bun.

**Mitigation:**
- Test connection pool under load
- Monitor connection count
- Adjust pool size if needed

## Middleware & Hooks

### Request Lifecycle

**Change:** Different hook names and execution order.

**Fastify Hooks:**
- `onRequest`
- `preParsing`
- `preValidation`
- `preHandler`
- `onResponse`

**Elysia Hooks:**
- `onRequest`
- `onBeforeHandle`
- `onAfterHandle`
- `onError`
- `onResponse`

**Impact:** Middleware execution order may differ slightly.

**Mitigation:**
- Test all middleware carefully
- Document execution order
- Ensure same functionality

## WebSocket Support

**Status:** Not yet implemented in Elysia version.

**Impact:** WebSocket endpoints not available initially.

**Mitigation:**
- Implement WebSocket support using Elysia's WebSocket plugin
- Ensure compatibility with existing clients

## File Upload

**Potential Change:** File upload handling differs between Fastify and Elysia.

**Impact:** Multipart form handling may need updates.

**Mitigation:**
- Test all file upload endpoints
- Ensure same size limits
- Verify file type validation

## Compatibility Matrix

| Feature | Fastify | Elysia | Compatible | Notes |
|---------|---------|--------|------------|-------|
| HTTP Methods | ✅ | ✅ | ✅ | All methods supported |
| JSON Body | ✅ | ✅ | ✅ | Automatic parsing |
| Form Body | ✅ | ✅ | ✅ | Built into Elysia |
| Query Params | ✅ | ✅ | ✅ | Same behavior |
| Path Params | ✅ | ✅ | ✅ | Same behavior |
| Headers | ✅ | ✅ | ✅ | Same behavior |
| Cookies | ✅ | ✅ | ✅ | Manual parsing needed |
| CORS | ✅ | ✅ | ✅ | Via plugin |
| Swagger | ✅ | ✅ | ✅ | Via plugin |
| JWT | ✅ | ✅ | ✅ | Via plugin |
| WebSocket | ✅ | ✅ | ⚠️ | Needs implementation |
| File Upload | ✅ | ✅ | ⚠️ | Different API |
| Session | ✅ | ✅ | ✅ | Custom implementation |
| Rate Limiting | ✅ | ⚠️ | ⚠️ | Needs implementation |
| Compression | ✅ | ⚠️ | ⚠️ | Needs testing |
| HTTPS | ✅ | ✅ | ✅ | Bun supports HTTPS |
| HTTP/2 | ✅ | ✅ | ✅ | Bun supports HTTP/2 |

## Client Compatibility

### Browser Clients

**No Breaking Changes:** All browser-based clients will work identically.

### Mobile Apps

**No Breaking Changes:** Mobile app clients require no changes.

### API Clients

**No Breaking Changes:** All API consumers remain compatible.

### SDK Compatibility

**No Breaking Changes:** Client SDKs require no updates.

## Deployment Changes

### Docker

**Change:** Dockerfile needs to use Bun base image instead of Node.js.

**Before:**
```dockerfile
FROM node:18-alpine
```

**After:**
```dockerfile
FROM oven/bun:1
```

**Impact:** Deployment process needs updating.

### Process Management

**Change:** No longer need pm2 or similar process managers.

**Impact:** Simpler deployment, but different monitoring.

### Health Checks

**No Breaking Changes:** Health check endpoints remain the same.

## Monitoring & Observability

### Metrics

**Potential Change:** Metrics format may differ.

**Impact:** Dashboards may need updates.

**Mitigation:**
- Update Grafana/Datadog dashboards
- Document new metric names
- Maintain same SLI/SLO definitions

### Tracing

**Status:** Sentry integration needs update for Elysia.

**Impact:** Error tracking may differ initially.

**Mitigation:**
- Implement Sentry plugin for Elysia
- Test error reporting
- Verify stack traces are correct

### Logging

**Potential Change:** Log structure may differ.

**Impact:** Log aggregation queries may need updates.

**Mitigation:**
- Maintain consistent log format
- Update Elasticsearch/Splunk queries
- Test log shipping

## Testing

### Unit Tests

**Impact:** Unit tests for route handlers need updates.

**Mitigation:**
- Update test fixtures
- Mock Elysia context instead of Fastify
- Ensure same test coverage

### Integration Tests

**Impact:** Integration tests may need minor updates.

**Mitigation:**
- Update HTTP client calls if needed
- Verify same test scenarios
- Add new tests for Elysia-specific features

### Load Tests

**Required:** New baseline needed for Elysia.

**Action Items:**
- Run load tests against Elysia version
- Compare with Fastify baseline
- Document performance differences

## Rollback Strategy

### Immediate Rollback

If critical issues are found:

1. Stop Elysia version
2. Start Fastify version (kept in parallel)
3. Update load balancer
4. Investigate issue

### Partial Rollback

If specific routes fail:

1. Route traffic for failed endpoints to Fastify
2. Keep working endpoints on Elysia
3. Fix issues incrementally

### Data Consistency

**No Impact:** Database schema unchanged, no data migration needed.

## Timeline for Changes

### Phase 1: Parallel Deployment (Week 1-2)
- Both Fastify and Elysia run in parallel
- Shadow traffic to Elysia
- Compare responses
- No user impact

### Phase 2: Gradual Rollout (Week 3-4)
- 10% traffic to Elysia
- Monitor for issues
- Gradual increase to 50%
- Quick rollback if needed

### Phase 3: Full Migration (Week 5-6)
- 100% traffic to Elysia
- Deprecate Fastify version
- Keep Fastify as backup for 2 weeks

### Phase 4: Cleanup (Week 7-8)
- Remove Fastify code
- Update documentation
- Final performance validation

## Support & Troubleshooting

### Known Issues

Document any known issues here as they are discovered.

### Troubleshooting Guide

Common issues and solutions:

1. **Issue:** Bun module not found
   - **Solution:** Run `bun install` to ensure dependencies are installed

2. **Issue:** TypeScript errors
   - **Solution:** Use `tsconfig.elysia.json` for Elysia code

3. **Issue:** Performance regression
   - **Solution:** Check connection pooling and adjust configuration

### Getting Help

- GitHub Issues: Use `elysia-migration` label
- Documentation: See ELYSIA_MIGRATION.md
- Team Chat: #elysia-migration channel

## Conclusion

While the migration from Fastify to Elysia involves significant internal changes, **the external API remains 100% compatible**. Clients should experience no breaking changes, with the added benefit of improved performance.

The main risks are:
1. Runtime differences between Node.js and Bun
2. Subtle behavior differences in edge cases
3. Performance characteristics under high load

These risks are mitigated by:
1. Comprehensive testing
2. Gradual rollout strategy
3. Parallel deployment
4. Quick rollback capability

---

**Last Updated:** 2025-11-04

**Version:** 1.0

**Status:** Pre-Migration Planning
