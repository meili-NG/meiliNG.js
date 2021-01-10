export enum MeilingV1ErrorType {
  UNAUTHORIZED = 'unauthorized',
  ALREADY_LOGGED_IN = 'already_logged_in',
  ALREADY_LOGGED_OUT = 'already_logged_out',
}

export interface MeilingV1ErrorResponse {
  type: MeilingV1ErrorType;
  description: string;
  code: string;
  url: string;
}
