import { FastifyReply } from 'fastify/types/reply';
import { buildErrorCodeURL } from '../../../common';
import { MeilingV1ErrorResponse, MeilingV1ErrorType } from './interfaces';

export function sendMeilingError(rep: FastifyReply, type: MeilingV1ErrorType, description?: string, code?: string) {
  let statusCode = 500;

  switch (type) {
    case MeilingV1ErrorType.UNAUTHORIZED:
      statusCode = 401;
      break;

    case MeilingV1ErrorType.ALREADY_SIGNED_IN:
    case MeilingV1ErrorType.ALREADY_SIGNED_OUT:
      statusCode = 406;
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
