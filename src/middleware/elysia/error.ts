import { Elysia } from 'elysia';
import { Meiling } from '../../common';
import { NodeEnvironment } from '../../interface';
import config from '../../resources/config';

/**
 * Error Handling Middleware for Elysia
 *
 * This middleware provides centralized error handling for the Elysia application.
 * It converts Meiling errors and other errors into appropriate HTTP responses.
 */

export interface ErrorResponse {
  success: false;
  error: string;
  type?: string;
  message?: string;
  description?: string;
  details?: string;
  debug?: any;
  stack?: string;
}

export interface OAuth2ErrorResponse {
  error: string;
  error_description?: string;
  error_uri?: string;
}

/**
 * Error Handler Plugin
 *
 * Handles all errors thrown in the application and formats them appropriately.
 */
export const errorHandlerMiddleware = new Elysia({ name: 'error-handler' })
  .onError(({ code, error, set }) => {
    const currentEnv = config.node.environment;

    // Handle MeilingV1Error
    if ((error as any)._isMeiling === true) {
      const meilingError = error as Meiling.V1.Error.MeilingError;

      // Set HTTP status code
      set.status = meilingError.statusCode || 500;

      // Build error response
      const response: ErrorResponse = {
        success: false,
        error: meilingError.type,
        type: meilingError.type,
        message: meilingError.message,
        description: meilingError.description,
      };

      // Add debug info in development mode
      if (currentEnv === NodeEnvironment.Development) {
        response.debug = meilingError.debug;
        response.stack = meilingError.stack;
      }

      return response;
    }

    // Handle OAuth2Error
    if ((error as any)._isOAuth2Error === true || error.name === 'OAuth2Error') {
      const oauth2Error = error as any;

      // Set HTTP status code
      set.status = oauth2Error.statusCode || 400;

      // Build OAuth2 error response (RFC 6749)
      const response: OAuth2ErrorResponse = {
        error: oauth2Error.type || 'invalid_request',
        error_description: oauth2Error.message || oauth2Error.description,
      };

      if (oauth2Error.uri) {
        response.error_uri = oauth2Error.uri;
      }

      return response;
    }

    // Handle validation errors
    if (code === 'VALIDATION') {
      set.status = 400;
      return {
        success: false,
        error: 'INVALID_REQUEST',
        type: 'INVALID_REQUEST',
        message: 'Request validation failed',
        details: error.message,
        ...(currentEnv === NodeEnvironment.Development && { stack: error.stack }),
      } as ErrorResponse;
    }

    // Handle NOT_FOUND
    if (code === 'NOT_FOUND') {
      set.status = 404;
      return {
        success: false,
        error: 'NOT_FOUND',
        type: 'NOT_FOUND',
        message: 'The requested resource was not found',
      } as ErrorResponse;
    }

    // Handle PARSE errors (invalid JSON, etc.)
    if (code === 'PARSE') {
      set.status = 400;
      return {
        success: false,
        error: 'INVALID_REQUEST',
        type: 'INVALID_REQUEST',
        message: 'Failed to parse request body',
        details: error.message,
      } as ErrorResponse;
    }

    // Generic error handler (500)
    set.status = 500;

    // Log error in production
    if (currentEnv !== NodeEnvironment.Testing) {
      console.error('Unhandled error:', error);
    }

    return {
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      type: 'INTERNAL_SERVER_ERROR',
      message: currentEnv === NodeEnvironment.Development
        ? error.message
        : 'An internal server error occurred',
      ...(currentEnv === NodeEnvironment.Development && {
        stack: error.stack,
        details: error.toString(),
      }),
    } as ErrorResponse;
  });

export default errorHandlerMiddleware;
