import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import { FastifyRequestWithSession } from '..';
import { getSanitizedUser } from '../../../../common/sanitize';
import { sendMeilingError } from '../error';
import { MeilingV1ErrorType } from '../interfaces';
import { userActionsHandler } from './actions';

export function userPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.get('/', meilingV1UserInfoHandler);
  app.get('/:userId', meilingV1UserInfoHandler);

  app.register(userActionsHandler, { prefix: '/:userId' });

  done();
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
