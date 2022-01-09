import { FastifyReply } from 'fastify/types/reply';
import { Meiling } from '../../..';
import { ErrorType } from './type';

export function sendOAuth2Error(rep: FastifyReply, error: ErrorType, description?: string, errorCode?: string): void {
  let statusCode = 500;

  switch (error) {
    case ErrorType.INVALID_REQUEST:
    case ErrorType.INVALID_SCOPE:
      statusCode = 400;
      break;
    case ErrorType.INVALID_CLIENT:
      statusCode = 401;
      break;
    case ErrorType.INVALID_GRANT:
    case ErrorType.UNAUTHORIZED_CLIENT:
    case ErrorType.RATE_LIMIT_EXCEEDED:
    case ErrorType.SLOW_DOWN:
    case ErrorType.ACCESS_DENIED:
      statusCode = 403;
      break;
    case ErrorType.AUTHORIZATION_PENDING:
      statusCode = 428;
      break;
    case ErrorType.UNSUPPORTED_GRANT_TYPE:
      statusCode = 504;
      break;
    default:
      statusCode = 500;
  }

  rep.status(statusCode).send({
    error,
    error_description: description,
    url: Meiling.Error.buildErrorCodeURL(errorCode),
  });
}
