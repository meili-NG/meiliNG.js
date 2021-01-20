import { FastifyReply } from 'fastify/types/reply';
import { buildErrorCodeURL } from '../../../common';
import { MeilingV1ErrorResponse, MeilingV1ErrorType } from './interfaces';

function getMeilingErrorStatusCode(type: MeilingV1ErrorType) {
  switch (type) {
    case MeilingV1ErrorType.TWO_FACTOR_AUTHENTICATION_REQUIRED:
      // it is draft, but lets try it anyway.
      // https://github.com/bretterer/HTTP-250-2FA-Required/blob/master/draft.adoc#why-250
      // return 250;

      // but for compatibility: here is 401.
      return 401;

    case MeilingV1ErrorType.AUTHENTICATION_REQUEST_NOT_GENERATED:
    case MeilingV1ErrorType.AUTHENTICATION_NOT_CURRENT_CHALLENGE_METHOD:
    case MeilingV1ErrorType.TWO_FACTOR_AUTHENTICATION_REQUEST_NOT_GENERATED:
    case MeilingV1ErrorType.INVALID_REQUEST:
    case MeilingV1ErrorType.INVALID_SIGNIN_METHOD:
    case MeilingV1ErrorType.INVALID_SIGNIN_TYPE:
    case MeilingV1ErrorType.ALREADY_SIGNED_IN:
    case MeilingV1ErrorType.ALREADY_SIGNED_OUT:
    case MeilingV1ErrorType.APPLICATION_REDIRECT_URI_INVALID:
      return 400;

    case MeilingV1ErrorType.UNAUTHORIZED:
    case MeilingV1ErrorType.WRONG_USERNAME:
    case MeilingV1ErrorType.WRONG_PASSWORD:
    case MeilingV1ErrorType.SIGNIN_FAILED:
    case MeilingV1ErrorType.INVALID_SESSION:
    case MeilingV1ErrorType.APPLICATION_NOT_AUTHENTICATED:
      return 401;

    case MeilingV1ErrorType.APPLICATION_NOT_FOUND:
      return 404;

    case MeilingV1ErrorType.UNSUPPORTED_SIGNIN_METHOD:
    case MeilingV1ErrorType.UNSUPPORTED_SCOPE:
    case MeilingV1ErrorType.UNSUPPORTED_RESPONSE_TYPE:
      return 405;

    case MeilingV1ErrorType.MORE_THAN_ONE_USER_MATCHED:
      return 409;

    case MeilingV1ErrorType.AUTHENTICATION_TIMEOUT:
      return 410;

    case MeilingV1ErrorType.NOT_IMPLEMENTED:
      return 501;
  }

  // the function for checking all cases are handled.
  // eslint-disable-next-line
  ((n: never) => {})(type);
}

export function sendMeilingError(rep: FastifyReply, type: MeilingV1ErrorType, description?: string, code?: string) {
  const statusCode = getMeilingErrorStatusCode(type);

  rep.status(statusCode).send({
    type,
    description,
    code,
    url: buildErrorCodeURL(code),
  } as MeilingV1ErrorResponse);
}
