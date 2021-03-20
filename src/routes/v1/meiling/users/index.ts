import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import { FastifyRequestWithSession } from '..';
import { User } from '../../../../common';
import { sendMeilingError } from '../error';
import * as Client from '../../../../common/client';
import { MeilingV1ErrorType } from '../interfaces';
import { meilingV1UserActionsHandler } from './actions';

export function meilingV1UserPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.get('/', meilingV1UserInfoHandler);
  app.get('/:userId', meilingV1UserInfoHandler);

  app.register(meilingV1UserActionsHandler, { prefix: '/:userId' });

  done();
}

async function getSanitizedUser(user: string): Promise<User.UserDetailedObject | undefined> {
  const userId = User.getUserId(user);
  const userData = await User.getDetailedInfo(userId);

  // fix any later
  if (userData?.authorizedApps) {
    for (let i = 0; i < userData.authorizedApps.length; i++) {
      userData.authorizedApps[i] = Client.sanitize(userData.authorizedApps[i]);
    }
  }

  if (userData?.createdApps) {
    for (let i = 0; i < userData.createdApps.length; i++) {
      userData.createdApps[i] = Client.sanitize(userData.createdApps[i]);
    }
  }

  return userData;
}

export async function meilingV1UserInfoHandler(req: FastifyRequest, rep: FastifyReply) {
  const session = (req as FastifyRequestWithSession).session;

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
