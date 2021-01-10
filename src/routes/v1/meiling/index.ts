import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { buildErrorCodeURL } from '../../../common';
import { MeilingV1ErrorResponse, MeilingErrorType as MeilingV1ErrorType } from './interfaces';

function sendMeilingError(rep: FastifyReply, type: MeilingV1ErrorType, description?: string, code?: string) {
  let statusCode = 500;
  if (type === MeilingV1ErrorType.UNAUTHORIZED) {
    statusCode = 401;
  }

  rep.status(statusCode).send({
    type,
    description,
    code,
    url: buildErrorCodeURL(code),
  } as MeilingV1ErrorResponse);
}

export function registerV1MeilingEndpoints(app: FastifyInstance, baseURI: string) {
  app.get(baseURI + '/user', meilingV1UserHandler);
}

export function meilingV1UserHandler(req: FastifyRequest, rep: FastifyReply) {
  const user = req.session.get('meiling-v1');
  if (user) {
  } else {
    sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED, 'You are not logged in.');
  }
}
