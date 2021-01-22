import { FastifyInstance } from 'fastify';
import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import { User } from '../../../../common';
import { MeilingV1Session } from '../common';
import { sendMeilingError } from '../error';
import { MeilingV1ErrorType } from '../interfaces';
import { registerV1MeilingUserActionsEndpoints } from './actions';

export function registerV1MeilingUserEndpoints(app: FastifyInstance, baseURI: string) {
  app.get(baseURI, meilingV1UserInfoHandler);
  app.get(baseURI + '/:userId', meilingV1UserInfoHandler);

  registerV1MeilingUserActionsEndpoints(app, baseURI + '/:userId');
}

export async function meilingV1UserInfoHandler(req: FastifyRequest, rep: FastifyReply) {
  const session = await MeilingV1Session.getSessionFromRequest(req);
  if (!session) {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_SESSION);
    return;
  }

  const userRawSession = session.user;
  const userId = (req.params as any)?.userId;

  if (userRawSession && userRawSession.length > 0) {
    if (userId && userId !== '') {
      const users = userRawSession.filter((n) => n.id === userId);

      if (users.length === 1) {
        const user = await User.getDetailedInfo(users[0].id);

        rep.send(user);
        return;
      }
    } else {
      const users = await MeilingV1Session.getSessionFromRequest(req);

      rep.send(users);
      return;
    }
  }

  sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED, 'You are not logged in.');
  return;
}
