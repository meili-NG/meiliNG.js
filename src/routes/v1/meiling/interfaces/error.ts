export enum MeilingErrorType {
  UNAUTHORIZED = 'unauthorized',
}

export interface MeilingV1ErrorResponse {
  type: MeilingErrorType;
  description: string;
  code: string;
  url: string;
}
