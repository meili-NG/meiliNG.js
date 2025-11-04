import { Elysia } from 'elysia';
import { Meiling } from '../../common';

/**
 * Session Middleware for Elysia
 *
 * This middleware extracts and validates the session from the request headers.
 * It adds the session object to the context, making it available to route handlers.
 */

export interface SessionContext {
  session: Meiling.V1.Interfaces.MeilingSession;
  user?: any; // Will be populated by user middleware if needed
}

/**
 * Extract session from Elysia request
 * @param request - Elysia request object
 * @returns Session object or null
 */
async function getSessionFromElysiaRequest(request: Request): Promise<Meiling.V1.Interfaces.MeilingSession | null> {
  // Extract session token from headers
  const authHeader = request.headers.get('Authorization');
  const sessionToken = request.headers.get('X-Meiling-Session');

  let token: string | null = null;

  // Check Authorization header (Bearer token)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }
  // Check X-Meiling-Session header
  else if (sessionToken) {
    token = sessionToken;
  }
  // Check cookies
  else {
    const cookieHeader = request.headers.get('Cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      token = cookies['meiling_session'] || null;
    }
  }

  if (!token) {
    return null;
  }

  // Validate and get session using existing Meiling logic
  try {
    const session = await Meiling.V1.Session.getSessionById(token);
    return session;
  } catch (error) {
    return null;
  }
}

/**
 * Optional Session Middleware
 *
 * Adds session to context if available, but doesn't require it.
 * Useful for routes that have different behavior for authenticated vs unauthenticated users.
 */
export const optionalSessionMiddleware = new Elysia({ name: 'optional-session' })
  .derive(async ({ request }) => {
    const session = await getSessionFromElysiaRequest(request);

    return {
      session: session || null,
    };
  });

/**
 * Required Session Middleware
 *
 * Requires a valid session to be present in the request.
 * Throws an error if no valid session is found.
 */
export const sessionMiddleware = new Elysia({ name: 'session' })
  .derive(async ({ request }) => {
    const session = await getSessionFromElysiaRequest(request);

    if (!session) {
      throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.INVALID_SESSION);
    }

    // Freeze session to prevent accidental modifications
    Object.freeze(session);

    return {
      session,
    };
  });

/**
 * User Session Middleware
 *
 * Requires a valid session and loads the associated user.
 * Useful for routes that need user information.
 */
export const userSessionMiddleware = new Elysia({ name: 'user-session' })
  .use(sessionMiddleware)
  .derive(async ({ session }) => {
    const user = await Meiling.Identity.User.getUser(session.userId);

    if (!user) {
      throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.USER_NOT_FOUND);
    }

    return {
      user,
    };
  });

/**
 * Admin Session Middleware
 *
 * Requires a valid admin token or session with admin permissions.
 * Useful for administrative routes.
 */
export const adminSessionMiddleware = new Elysia({ name: 'admin-session' })
  .derive(async ({ request }) => {
    // Check for admin token in Authorization header
    const authHeader = request.headers.get('Authorization');

    if (authHeader) {
      // Try Basic auth first
      if (authHeader.startsWith('Basic ')) {
        const credentials = Buffer.from(authHeader.substring(6), 'base64').toString();
        const [username, password] = credentials.split(':');

        const token = await Meiling.Authentication.Token.getToken(username);
        if (!token || !Meiling.Authentication.Token.validateToken(token, password)) {
          throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.UNAUTHORIZED);
        }

        return {
          adminToken: token,
          isAdmin: true,
        };
      }
      // Try Bearer token
      else if (authHeader.startsWith('Bearer ')) {
        const tokenId = authHeader.substring(7);
        const token = await Meiling.Authentication.Token.getToken(tokenId);

        if (!token) {
          throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.UNAUTHORIZED);
        }

        return {
          adminToken: token,
          isAdmin: true,
        };
      }
    }

    throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.UNAUTHORIZED);
  });

export default sessionMiddleware;
