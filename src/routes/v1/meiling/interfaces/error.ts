export enum MeilingV1ErrorType {
  UNAUTHORIZED = 'unauthorized',
  ALREADY_SIGNED_IN = 'already_signed_in',
  ALREADY_SIGNED_OUT = 'already_signed_out',
  INVALID_REQUEST = 'invalid_request',
  INVALID_SESSION = 'invalid_session',
  WRONG_USERNAME = 'wrong_username',
  WRONG_PASSWORD = 'wrong_password',
  INVALID_SIGNIN_TYPE = 'invalid_signin_type',
  INVALID_SIGNIN_METHOD = 'invalid_signin_method',
  SIGNIN_FAILED = 'signin_failed',
  UNSUPPORTED_SIGNIN_METHOD = 'unsupported_signin_method',
  UNSUPPORTED_SCOPE = 'unsupported_scope',
  UNSUPPORTED_RESPONSE_TYPE = 'unsupported_response_type',
  TWO_FACTOR_AUTHENTICATION_REQUIRED = 'two_factor_authentication_required',
  TWO_FACTOR_AUTHENTICATION_REQUEST_NOT_GENERATED = 'two_factor_authentication_request_not_generated',
  MORE_THAN_ONE_USER_MATCHED = 'more_than_one_user_matched',
  AUTHENTICATION_REQUEST_NOT_GENERATED = 'authentication_request_not_generated',
  AUTHENTICATION_NOT_CURRENT_CHALLENGE_METHOD = 'authentication_not_current_challenge_method',
  AUTHENTICATION_TIMEOUT = 'authentication_timeout',
  NOT_IMPLEMENTED = 'not_implemented',
  APPLICATION_NOT_FOUND = 'application_not_found',
  APPLICATION_REDIRECT_URI_INVALID = 'application_redirect_uri_invalid',
  APPLICATION_NOT_AUTHENTICATED = 'application_not_authenticated',
}

export interface MeilingV1ErrorResponse {
  type: MeilingV1ErrorType;
  description: string;
  code: string;
  url: string;
}
