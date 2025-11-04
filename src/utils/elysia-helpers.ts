/**
 * Elysia Helper Utilities
 *
 * This module provides helper functions and utilities for migrating from Fastify to Elysia.
 * It includes adapters and convenience functions to ease the migration process.
 */

import { Elysia, t } from 'elysia';

/**
 * Common Type Schemas
 *
 * Pre-defined TypeBox schemas for common data types used throughout the API.
 */
export const CommonSchemas = {
  // User ID (UUID or numeric string)
  UserId: t.String({ description: 'User ID' }),

  // Session Token
  SessionToken: t.String({ description: 'Session token', minLength: 1 }),

  // Email
  Email: t.String({ format: 'email', description: 'Email address' }),

  // Phone Number
  Phone: t.String({ description: 'Phone number' }),

  // Password
  Password: t.String({ minLength: 8, description: 'Password (min 8 characters)' }),

  // OAuth2 Client ID
  ClientId: t.String({ description: 'OAuth2 client ID' }),

  // OAuth2 Scope
  Scope: t.String({ description: 'OAuth2 scope' }),

  // Pagination
  Pagination: t.Object({
    page: t.Optional(t.Number({ minimum: 1, default: 1 })),
    limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
  }),

  // Success Response
  SuccessResponse: t.Object({
    success: t.Literal(true),
  }),

  // Error Response (matches Meiling error format)
  ErrorResponse: t.Object({
    success: t.Literal(false),
    error: t.String(),
    type: t.Optional(t.String()),
    message: t.Optional(t.String()),
    description: t.Optional(t.String()),
    details: t.Optional(t.String()),
    debug: t.Optional(t.Any()),
    stack: t.Optional(t.String()),
  }),
};

/**
 * Response Builders
 *
 * Helper functions to build standardized responses.
 */
export const Response = {
  /**
   * Success response
   */
  success<T>(data: T) {
    return {
      success: true as const,
      ...data,
    };
  },

  /**
   * Error response
   */
  error(error: string, message?: string, details?: any) {
    return {
      success: false as const,
      error,
      message,
      details,
    };
  },

  /**
   * Paginated response
   */
  paginated<T>(items: T[], page: number, limit: number, total: number) {
    return {
      success: true as const,
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },
};

/**
 * Request Helpers
 *
 * Helper functions for extracting data from requests.
 */
export const Request = {
  /**
   * Extract Bearer token from Authorization header
   */
  getBearerToken(request: Request): string | null {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  },

  /**
   * Extract Basic auth credentials from Authorization header
   */
  getBasicAuth(request: Request): { username: string; password: string } | null {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return null;
    }

    try {
      const credentials = Buffer.from(authHeader.substring(6), 'base64').toString();
      const [username, password] = credentials.split(':');
      return { username, password };
    } catch {
      return null;
    }
  },

  /**
   * Parse cookies from Cookie header
   */
  getCookies(request: Request): Record<string, string> {
    const cookieHeader = request.headers.get('Cookie');
    if (!cookieHeader) {
      return {};
    }

    return cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) {
        acc[key] = decodeURIComponent(value);
      }
      return acc;
    }, {} as Record<string, string>);
  },

  /**
   * Get client IP address from request
   */
  getClientIP(request: Request, trustProxy: boolean = false): string {
    if (trustProxy) {
      const forwarded = request.headers.get('X-Forwarded-For');
      if (forwarded) {
        return forwarded.split(',')[0].trim();
      }

      const realIP = request.headers.get('X-Real-IP');
      if (realIP) {
        return realIP;
      }
    }

    // Bun doesn't expose socket info directly, default to unknown
    return 'unknown';
  },
};

/**
 * Validation Helpers
 *
 * Helper functions for common validation tasks.
 */
export const Validation = {
  /**
   * Check if string is a valid email
   */
  isEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  /**
   * Check if string is a valid UUID
   */
  isUUID(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  },

  /**
   * Check if string is a valid URL
   */
  isURL(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Sanitize string (remove dangerous characters)
   */
  sanitize(value: string): string {
    return value.replace(/[<>]/g, '');
  },
};

/**
 * Migration Helper
 *
 * Helps track which routes have been migrated and which are pending.
 */
export class MigrationTracker {
  private migratedRoutes: Set<string> = new Set();
  private pendingRoutes: Set<string> = new Set();

  markMigrated(route: string) {
    this.migratedRoutes.add(route);
    this.pendingRoutes.delete(route);
  }

  markPending(route: string) {
    this.pendingRoutes.add(route);
  }

  isMigrated(route: string): boolean {
    return this.migratedRoutes.has(route);
  }

  isPending(route: string): boolean {
    return this.pendingRoutes.has(route);
  }

  getStats() {
    return {
      migrated: this.migratedRoutes.size,
      pending: this.pendingRoutes.size,
      total: this.migratedRoutes.size + this.pendingRoutes.size,
      migratedRoutes: Array.from(this.migratedRoutes),
      pendingRoutes: Array.from(this.pendingRoutes),
    };
  }
}

/**
 * Plugin Helper
 *
 * Creates an Elysia plugin with common configuration.
 */
export function createPlugin(name: string, prefix?: string) {
  const config: any = { name };
  if (prefix) {
    config.prefix = prefix;
  }
  return new Elysia(config);
}

/**
 * Route Group Helper
 *
 * Groups related routes together with shared middleware.
 */
export function createRouteGroup(prefix: string, setup: (app: Elysia) => Elysia) {
  const app = new Elysia({ prefix });
  return setup(app);
}

export default {
  CommonSchemas,
  Response,
  Request,
  Validation,
  MigrationTracker,
  createPlugin,
  createRouteGroup,
};
