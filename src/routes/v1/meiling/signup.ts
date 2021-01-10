import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import { sendMeilingError } from './error';
import { MeilingV1Session, MeilingV1ErrorType } from './interfaces';

export async function meilingV1SignupHandler(req: FastifyRequest, rep: FastifyReply) {
  const session = req.session.get('meiling-v1') as MeilingV1Session | null | undefined;

  if (session?.user?.id) {
    sendMeilingError(rep, MeilingV1ErrorType.ALREADY_LOGGED_IN, 'You are already logged in.');
    return;
  } else {
  }
}
