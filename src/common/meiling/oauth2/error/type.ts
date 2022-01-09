export enum ErrorType {
  INVALID_REQUEST = 'invalid_request',
  INVALID_CLIENT = 'invalid_client',
  INVALID_GRANT = 'invalid_grant',
  UNAUTHORIZED_CLIENT = 'unauthorized_client',
  UNSUPPORTED_GRANT_TYPE = 'unsupported_grant_type',
  INVALID_SCOPE = 'invalid_scope',

  /**
   * Returns when Rate limit has exceeded.
   * **NOT oAuth2 Compliant.**
   **/
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SLOW_DOWN = 'slow_down',
  AUTHORIZATION_PENDING = 'authorization_pending',
  ACCESS_DENIED = 'access_denied',

  INTERNAL_SERVER_ERROR = 'internal_server_error',
}
