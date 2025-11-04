/**
 * Session Route - Elysia Migration
 *
 * This is the Elysia version of the session route.
 * Original: src/routes/v1/meiling/session.ts
 */

import { Elysia, t } from 'elysia';
import { Meiling } from '../../../common';
import { BaridegiLogType, sendBaridegiLog } from '../../../common/event/baridegi';
import { optionalSessionMiddleware } from '../../../middleware/elysia';

/**
 * Extract session token from Elysia request
 */
function getTokenFromRequest(request: Request): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check X-Meiling-Session header
  const sessionHeader = request.headers.get('X-Meiling-Session');
  if (sessionHeader) {
    return sessionHeader;
  }

  // Check cookies
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    return cookies['meiling_session'] || null;
  }

  return null;
}

/**
 * Get client IP from request
 */
function getClientIP(request: Request): string {
  const forwarded = request.headers.get('X-Forwarded-For');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('X-Real-IP');
  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

/**
 * Create request object compatible with existing session functions
 * This is a temporary adapter until the session functions are updated
 */
function createFastifyLikeRequest(request: Request): any {
  return {
    headers: Object.fromEntries(request.headers.entries()),
    ip: getClientIP(request),
  };
}

/**
 * Session Plugin
 *
 * Handles session creation and validation
 */
export const sessionPlugin = new Elysia({ prefix: '/session' })
  .use(optionalSessionMiddleware)
  .get(
    '/',
    async ({ request, session, set }) => {
      let token = getTokenFromRequest(request);

      // If token exists, validate it
      if (token && token.trim() !== '') {
        const [isToken, isValid] = await Promise.all([
          Meiling.V1.Session.isToken(token),
          Meiling.V1.Session.isValid(token),
        ]);

        if (isToken && isValid) {
          set.status = 200;
          return {
            success: true,
          };
        } else {
          throw new Meiling.V1.Error.MeilingError(
            Meiling.V1.Error.ErrorType.INVALID_TOKEN,
            'Your token is expired'
          );
        }
      }
      // No token, create a new session
      else {
        const fastifyLikeReq = createFastifyLikeRequest(request);
        token = await Meiling.V1.Session.createToken(fastifyLikeReq);

        sendBaridegiLog(BaridegiLogType.NEW_SESSION, {
          ip: fastifyLikeReq.ip,
          token: token,
        });

        if (token) {
          set.status = 201;
          return {
            success: true,
            token,
          };
        } else {
          throw new Meiling.V1.Error.MeilingError(
            Meiling.V1.Error.ErrorType.INTERNAL_SERVER_ERROR,
            'Failed to issue a token'
          );
        }
      }
    },
    {
      detail: {
        description: 'Issue a new Session token or Verify Session token for meiliNG V1 Endpoints',
        tags: ['meiling'],
        summary: 'Issue a new Session',
        security: [{}, { sessionV1: [] }],
      },
      response: {
        200: t.Object({
          success: t.Literal(true),
        }, {
          description: 'Token is Valid',
        }),
        201: t.Object({
          success: t.Literal(true),
          token: t.String(),
        }, {
          description: 'Issued Token',
        }),
      },
    }
  );

export default sessionPlugin;
