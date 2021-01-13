import { FastifyInstance } from 'fastify';
import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import { getAllUserInfo } from '../../../../common/user';
import { getLoggedInMeilingV1Session, getMeilingV1Session } from '../common';
import { sendMeilingError } from '../error';
import { MeilingV1ErrorType } from '../interfaces';

export function registerV1MeilingUserEndpoints(app: FastifyInstance, baseURI: string) {
  app.get(baseURI, meilingV1UserInfoHandler);
  app.get(baseURI + '/:userId', meilingV1UserInfoHandler);
}

export async function meilingV1UserInfoHandler(req: FastifyRequest, rep: FastifyReply) {
  let session;
  try {
    session = await getMeilingV1Session(req);
  } catch (e) {
    sendMeilingError(rep, MeilingV1ErrorType.NOT_A_PROPER_SESSION);
    return;
  }

  const userRawSession = (await getMeilingV1Session(req)).user;
  const userId = (req.params as any)?.userId;

  if (userRawSession && userRawSession.length > 0) {
    if (userId && userId !== '') {
      const users = userRawSession.filter((n) => n.id === userId);

      if (users.length === 1) {
        const user = await getAllUserInfo(users[0].id);

        rep.send(user);
        return;
      }
    } else {
      const users = await getLoggedInMeilingV1Session(req);

      rep.send(users);
    }
  }

  sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED, 'You are not logged in.');
  return;
}
