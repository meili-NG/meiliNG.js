import { ErrorType } from './type';

export interface ErrorResponse {
  type: ErrorType;
  description: string;
  code: string;
  url: string;
}
