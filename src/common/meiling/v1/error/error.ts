import chalk from 'chalk';
import { FastifyReply } from 'fastify/types/reply';
import { Meiling } from '../../..';
import { NodeEnvironment } from '../../../../interface';
import config from '../../../../resources/config';
import { ErrorResponse } from './interface';
import { ErrorType } from './type';

function getMeilingErrorStatusCode(type: ErrorType) {
  switch (type) {
    case ErrorType.TWO_FACTOR_AUTHENTICATION_REQUIRED:
      // it is draft, but lets try it anyway.
      // https://github.com/bretterer/HTTP-250-2FA-Required/blob/master/draft.adoc#why-250
      // return 250;

      // but for compatibility: here is 401.
      return 401;

    case ErrorType.AUTHENTICATION_REQUEST_NOT_GENERATED:
    case ErrorType.AUTHENTICATION_NOT_CURRENT_CHALLENGE_METHOD:
    case ErrorType.TWO_FACTOR_AUTHENTICATION_REQUEST_NOT_GENERATED:
    case ErrorType.INVALID_REQUEST:
    case ErrorType.INVALID_TOKEN:
    case ErrorType.INVALID_SIGNIN_METHOD:
    case ErrorType.INVALID_SIGNIN_TYPE:
    case ErrorType.ALREADY_SIGNED_IN:
    case ErrorType.ALREADY_SIGNED_OUT:
    case ErrorType.APPLICATION_REDIRECT_URI_INVALID:
    case ErrorType.AUTHORIZATION_REQUEST_NOT_GENERATED:
    case ErrorType.AUTHORIZATION_REQUEST_NOT_COMPLETED:
      return 400;

    case ErrorType.UNAUTHORIZED:
    case ErrorType.WRONG_USERNAME:
    case ErrorType.WRONG_PASSWORD:
    case ErrorType.SIGNIN_FAILED:
    case ErrorType.INVALID_SESSION:
    case ErrorType.APPLICATION_NOT_AUTHORIZED_BY_USER:
    case ErrorType.APPLICATION_NOT_AUTHORIZED_SCOPES:
    case ErrorType.AUTHORIZATION_REQUEST_INVALID:
      return 401;

    case ErrorType.FORBIDDEN:
      return 403;

    case ErrorType.APPLICATION_NOT_FOUND:
    case ErrorType.NOT_FOUND:
      return 404;

    case ErrorType.UNSUPPORTED_SIGNIN_METHOD:
    case ErrorType.UNSUPPORTED_SCOPE:
    case ErrorType.UNSUPPORTED_RESPONSE_TYPE:
    case ErrorType.UNSUPPORTED_AUTHORIZATION_TYPE:
      return 405;

    case ErrorType.MORE_THAN_ONE_USER_MATCHED:
    case ErrorType.APPLICATION_USER_ACTION_REQUIRED:
    case ErrorType.EXISTING_USERNAME:
    case ErrorType.EXISTING_PASSWORD:
    case ErrorType.EMAIL_NOT_ALLOWED:
    case ErrorType.PHONE_NOT_ALLOWED:
    case ErrorType.CONFLICT:
      return 409;

    case ErrorType.AUTHENTICATION_TIMEOUT:
    case ErrorType.AUTHORIZATION_REQUEST_TIMEOUT:
      return 410;

    case ErrorType.AUTHORIZATION_REQUEST_RATE_LIMITED:
      return 429;

    case ErrorType.INTERNAL_SERVER_ERROR:
      return 500;

    case ErrorType.NOT_IMPLEMENTED:
      return 501;
  }

  // the function for checking all cases are handled.
  // eslint-disable-next-line
  ((n: never) => {})(type);
}

export function sendMeilingError(rep: FastifyReply, type: ErrorType, description?: string, code?: string): void {
  if (config.node.environment === NodeEnvironment.Development)
    console.error(chalk.red('[ERROR]'), 'Error Report', type);

  const statusCode = getMeilingErrorStatusCode(type);

  rep.status(statusCode).send({
    type,
    description,
    code,
    url: Meiling.Error.buildErrorCodeURL(code),
  } as ErrorResponse);
}
