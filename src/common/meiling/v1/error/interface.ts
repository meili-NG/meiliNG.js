import { ErrorType } from './type';

export interface ErrorResponse {
  type: ErrorType;
  description?: string;
  details?: any;
  debug?: any;
  stack?: string;

  code?: string;
  url?: string;
}
