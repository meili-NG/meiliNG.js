import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import {
  getLoggedInMeilingV1Session,
  getMeilingV1Session,
  logoutMeilingV1Session,
  setMeilingV1Session,
} from './common';
import { sendMeilingError } from './error';
import { MeilingV1ErrorType } from './interfaces';

interface MeilingV1SignOutQuery {
  userId?: string;
}

export async function meilingV1SignoutHandler(req: FastifyRequest, rep: FastifyReply) {
  const session = await getMeilingV1Session(req);
  if (!session) {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_SESSION);
    return;
  }

  const userId = (req.query as MeilingV1SignOutQuery)?.userId
    ? (req.query as MeilingV1SignOutQuery)?.userId
    : (req.params as MeilingV1SignOutQuery).userId;
  const user = session.user;

  if (user && user.length > 0) {
    if (userId === undefined) {
      await logoutMeilingV1Session(req);
    } else {
      if (userId && user.filter((n) => n.id === userId).length > 0) {
        await logoutMeilingV1Session(req, userId);
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
