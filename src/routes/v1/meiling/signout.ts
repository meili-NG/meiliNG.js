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
  const uuid = (req.query as any).uuid;
  const user = getMeilingV1Session(req).user;

  if (user && user.length > 0 && uuid && user.filter((n) => n.id === uuid).length > 0) {
    if (uuid === undefined) {
      setMeilingV1Session(req, {});
    } else {
      await logoutMeilingV1Session(req, uuid);
    }
  } else {
    sendMeilingError(rep, MeilingV1ErrorType.ALREADY_SIGNED_OUT, 'you are already signed out.');
    return;
  }

  rep.send({
    success: true,
  });
}
