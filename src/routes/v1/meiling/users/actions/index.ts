import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from 'fastify';
import { User } from '../../../../../common';
import { MeilingV1Session } from '../../common';
import { sendMeilingError } from '../../error';
import { MeilingV1ErrorType } from '../../interfaces';
import { userAppPlugin } from './apps';
import { clientAuthPlugin } from './auth';
import { userGetInfo } from './info/get';
import { userUpdateInfo } from './info/put';
import userSecurityPlugin from './security';
import userPasswordsPlugin from './security/passwords';

export interface MeilingV1UserActionsParams {
  userId: string;
}

export function userActionsHandler(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void) {
  // /v1/meiling/user/:userId/action
  // TODO: Implement authentication
  app.addHook('onRequest', async (req, rep) => {
    const userBase = await getUserFromActionRequest(req);
    if (userBase === undefined) {
      sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'invalid request.');
      throw new Error('User is not privileged to run this command');
    } else if (userBase === null) {
      sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED, 'you are not logged in as specified user.');
      throw new Error('User is not privileged to run this command');
    }
  });

  app.get('/', userGetInfo);
  app.put('/', userUpdateInfo);

  // TODO: Remove this later.
  // legacy compatibility reasons. will be deprecated in future.
  // migrate to `/v1/security/passwords`.
  app.register(userPasswordsPlugin, { prefix: '/passwords' });

  app.register(clientAuthPlugin, { prefix: '/auth' });
  app.register(userAppPlugin, { prefix: '/apps' });
  app.register(userSecurityPlugin, { prefix: '/security' });

  done();
}

export async function getUserFromActionRequest(req: FastifyRequest): Promise<User.UserInfoObject | undefined | null> {
  const users = await MeilingV1Session.getLoggedIn(req);
  const userId = (req.params as { userId: string }).userId;

  const user = users.find((n) => n.id === userId);

  return userId === undefined ? undefined : user === undefined ? null : user;
}
