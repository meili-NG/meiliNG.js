import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import { getLoggedInMeilingV1Session, getMeilingV1Session } from './common';
import { sendMeilingError } from './error';
import { MeilingV1ErrorType } from './interfaces';

export async function meilingV1UserInfoHandler(req: FastifyRequest, rep: FastifyReply) {
  const currentlyLoggedInUsers = await getLoggedInMeilingV1Session(req);

  if (currentlyLoggedInUsers.length > 0) {
    rep.send(currentlyLoggedInUsers);
  } else {
    sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED, 'You are not logged in.');
    return;
  }
}
