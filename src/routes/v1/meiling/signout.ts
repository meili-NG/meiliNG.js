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

interface MeilingV1Signup {
  username: string;
  phone: string;
  email: string;
  password: string;
}

export async function meilingV1SignoutHandler(req: FastifyRequest, rep: FastifyReply) {
  const session = await getMeilingV1Session(req);
  if (!session) {
    sendMeilingError(rep, MeilingV1ErrorType.NOT_A_PROPER_SESSION);
    return;
  }

  const uuid = (req.query as any)?.uuid ? (req.query as any)?.uuid : (req.params as any).uuid;
  const user = session.user;

  if (user && user.length > 0) {
    if (uuid === undefined) {
      await logoutMeilingV1Session(req);
    } else {
      if (uuid && user.filter((n) => n.id === uuid).length > 0) {
        await logoutMeilingV1Session(req, uuid);
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
