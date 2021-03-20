import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import { FastifyRequestWithSession } from '.';
import { MeilingV1Session } from './common';
import { sendMeilingError } from './error';
import { MeilingV1ErrorType } from './interfaces';

interface MeilingV1SignOutQuery {
  userId?: string;
}

export async function meilingV1SignoutHandler(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const session = (req as FastifyRequestWithSession).session;

  const userId = (req.query as MeilingV1SignOutQuery)?.userId
    ? (req.query as MeilingV1SignOutQuery)?.userId
    : (req.params as MeilingV1SignOutQuery).userId;
  const user = session.user;

  if (user && user.length > 0) {
    if (userId === undefined) {
      await MeilingV1Session.logout(req);
    } else {
      if (userId && user.filter((n) => n.id === userId).length > 0) {
        await MeilingV1Session.logout(req, userId);
      } else {
        sendMeilingError(rep, MeilingV1ErrorType.ALREADY_SIGNED_OUT, 'you are already signed out.');
        return;
      }
    }
  } else {
    sendMeilingError(rep, MeilingV1ErrorType.ALREADY_SIGNED_OUT, 'you are already signed out.');
    return;
  }

  rep.send({
    success: true,
  });
}
