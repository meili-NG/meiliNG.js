import { ErrorType } from './type';

export interface ErrorResponse {
  error: ErrorType;
  error_description?: string;
  error_uri?: string;
}
