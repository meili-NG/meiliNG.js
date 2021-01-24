import { FastifyInstance } from 'fastify';
import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import { User } from '../../../../common';
import { sanitizeClient } from '../../../../common/oauth2';
import { MeilingV1Session } from '../common';
import { sendMeilingError } from '../error';
import { MeilingV1ErrorType } from '../interfaces';
import { registerV1MeilingUserActionsEndpoints } from './actions';

export function registerV1MeilingUserEndpoints(app: FastifyInstance, baseURI: string) {
  app.get(baseURI, meilingV1UserInfoHandler);
  app.get(baseURI + '/:userId', meilingV1UserInfoHandler);

  registerV1MeilingUserActionsEndpoints(app, baseURI + '/:userId');
}

async function getSanitizedUser(user: string) {
  const userId = User.getUserId(user);
  const userData = await User.getDetailedInfo(userId);

  // fix any later
  if (userData?.authorizedApps) {
    for (let i = 0; i < userData.authorizedApps.length; i++) {
      userData.authorizedApps[i] = sanitizeClient(userData.authorizedApps[i] as any) as any;
    }
  }

  if (userData?.createdApps) {
    for (let i = 0; i < userData.createdApps.length; i++) {
      userData.createdApps[i] = sanitizeClient(userData.createdApps[i] as any) as any;
    }
  }

  return userData;
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
        const user = await getSanitizedUser(users[0].id);

        rep.send(user);
        return;
      }
    } else {
      const users = session.user;
      if (!users) {
        sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED, 'You are not logged in.');
        return;
      }

      const resultPromise = [];

      for (const user of users) {
        resultPromise.push(getSanitizedUser(user.id));
      }
      const result = await Promise.all(resultPromise);

      rep.send(result);
      return;
    }
  }

  sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED, 'You are not logged in.');
  return;
}
