export enum MeilingV1ErrorType {
  UNAUTHORIZED = 'unauthorized',
  ALREADY_SIGNED_IN = 'already_signed_in',
  ALREADY_SIGNED_OUT = 'already_signed_out',
  INVALID_REQUEST = 'invalid_request',
  WRONG_USERNAME = 'wrong_username',
  WRONG_PASSWORD = 'wrong_password',
  TWO_FACTOR_AUTHENTICATION_REQUIRED = '2fa_required',
  TWO_FACTOR_AUTHENTICATION_REQUEST_NOT_GENERATED = '2fa_authentication_request_not_generated',
  MORE_THAN_ONE_USER_MATCHED = 'more_than_one_user_matched',
  PASSWORDLESS_REQUEST_NOT_GENERATED = 'passwordless_request_not_generated',
  PASSWORDLESS_INVALID_METHOD = 'passwordless_invalid_method',
  PASSWORDLESS_NOT_CURRENT_CHALLENGE_METHOD = 'passwordless_not_current_challenge_method',
  PASSWORDLESS_SIGNIN_FAILED = 'passwordless_request_not_generated',
}

export interface MeilingV1ErrorResponse {
  type: MeilingV1ErrorType;
  description: string;
  code: string;
  url: string;
}
