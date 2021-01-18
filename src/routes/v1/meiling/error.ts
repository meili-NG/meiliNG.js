import { FastifyReply } from 'fastify/types/reply';
import { buildErrorCodeURL } from '../../../common';
import { MeilingV1ErrorResponse, MeilingV1ErrorType } from './interfaces';

export function sendMeilingError(rep: FastifyReply, type: MeilingV1ErrorType, description?: string, code?: string) {
  let statusCode = 500;

  switch (type) {
    case MeilingV1ErrorType.TWO_FACTOR_AUTHENTICATION_REQUIRED:
      // it is draft, but lets try it anyway.
      // https://github.com/bretterer/HTTP-250-2FA-Required/blob/master/draft.adoc#why-250
      statusCode = 250;

      // but for compatibility: here is 401.
      statusCode = 401;
      break;

    case MeilingV1ErrorType.AUTHENTICATION_REQUEST_NOT_GENERATED:
    case MeilingV1ErrorType.AUTHENTICATION_NOT_CURRENT_CHALLENGE_METHOD:
    case MeilingV1ErrorType.TWO_FACTOR_AUTHENTICATION_REQUEST_NOT_GENERATED:
    case MeilingV1ErrorType.INVALID_REQUEST:
    case MeilingV1ErrorType.INVALID_SIGNIN_METHOD:
    case MeilingV1ErrorType.INVALID_SIGNIN_TYPE:
    case MeilingV1ErrorType.ALREADY_SIGNED_IN:
    case MeilingV1ErrorType.ALREADY_SIGNED_OUT:
      statusCode = 400;
      break;

    case MeilingV1ErrorType.UNAUTHORIZED:
    case MeilingV1ErrorType.WRONG_USERNAME:
    case MeilingV1ErrorType.WRONG_PASSWORD:
    case MeilingV1ErrorType.SIGNIN_FAILED:
    case MeilingV1ErrorType.INVALID_SESSION:
      statusCode = 401;
      break;

    case MeilingV1ErrorType.APPLICATION_NOT_FOUND:
      statusCode = 404;
      break;

    case MeilingV1ErrorType.UNSUPPORTED_SIGNIN_METHOD:
      statusCode = 405;
      break;

    case MeilingV1ErrorType.MORE_THAN_ONE_USER_MATCHED:
      statusCode = 409;
      break;

    case MeilingV1ErrorType.AUTHENTICATION_TIMEOUT:
      statusCode = 410;
      break;

    case MeilingV1ErrorType.NOT_IMPLEMENTED:
      statusCode = 501;
      break;

    default:
      statusCode = 500;
      break;
  }

  rep.status(statusCode).send({
    type,
    description,
    code,
    url: buildErrorCodeURL(code),
  } as MeilingV1ErrorResponse);
}
