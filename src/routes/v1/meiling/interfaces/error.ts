export enum MeilingV1ErrorType {
  UNAUTHORIZED = 'unauthorized',
  ALREADY_LOGGED_IN = 'already_logged_in',
  ALREADY_LOGGED_OUT = 'already_logged_out',
  INVALID_REQUEST = 'invalid_request',
  WRONG_USERNAME = 'wrong_username',
  WRONG_PASSWORD = 'wrong_password',
  TWO_FACTOR_AUTHENTICATION_REQUIRED = '2fa_required',
  MORE_THAN_ONE_USER_MATCHED = 'more_than_one_user_matched',
}

export interface MeilingV1ErrorResponse {
  type: MeilingV1ErrorType;
  description: string;
  code: string;
  url: string;
}
