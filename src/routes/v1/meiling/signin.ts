import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import { sendMeilingError } from './error';
import { MeilingV1Session, MeilingV1ErrorType } from './interfaces';
import { MeilingV1SignInBody, MeilingV1SigninType } from './interfaces/query';

export async function meilingV1SigninHandler(req: FastifyRequest, rep: FastifyReply) {
  const session = req.session.get('meiling-v1') as MeilingV1Session | null | undefined;

  if (session?.user?.id) {
    sendMeilingError(rep, MeilingV1ErrorType.ALREADY_LOGGED_IN, 'You are already logged in.');
    return;
  }

  if (typeof req.body !== 'string') {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'invalid request type');
    return;
  }

  const body = JSON.parse(req.body) as MeilingV1SignInBody;

  switch (body.type) {
    case MeilingV1SigninType.USERNAME_AND_PASSWORD:
      break;
    case MeilingV1SigninType.TWO_FACTOR_AUTH:
    case MeilingV1SigninType.PASSWORDLESS:
  }
}
