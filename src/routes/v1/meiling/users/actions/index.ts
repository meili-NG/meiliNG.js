import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from 'fastify';
import { Meiling } from '../../../../../common';
import { userAppPlugin } from './apps';
import { clientAuthPlugin } from './auth';
import userEmailsPlugin from './emails';
import { userDelete } from './info/delete';
import { userGetInfo } from './info/get';
import { userUpdateInfo } from './info/put';
import userPhonesPlugin from './phones';
import userSecurityPlugin from './security';
import userPasswordsPlugin from './security/passwords';
import * as Sentry from '@sentry/node';
import { isSentryAvailable } from '../../../../../common/sentry/tracer';
import { FastifyRequestWithUser } from '../..';

export function userActionsHandler(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void) {
  if (!app.hasRequestDecorator('user')) {
    app.decorateRequest('user', undefined);
  }

  // /v1/meiling/user/:userId/action
  // TODO: Implement authentication
  app.addHook('onRequest', async (req, rep) => {
    const userBase = await getUserFromActionRequest(req);
    if (userBase === undefined) {
      throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.INVALID_REQUEST, 'invalid request.');
    } else if (userBase === null) {
      throw new Meiling.V1.Error.MeilingError(
        Meiling.V1.Error.ErrorType.UNAUTHORIZED,
        'you are not logged in as specified user.',
      );
    }

    (req as FastifyRequestWithUser).user = userBase;
  });

  app.get('/', userGetInfo);
  app.put('/', userUpdateInfo);
  app.delete('/', userDelete);

  // TODO: Remove this later.
  // legacy compatibility reasons. will be deprecated in future.
  // migrate to `/v1/security/passwords`.
  app.register(userPasswordsPlugin, { prefix: '/passwords' });

  app.register(clientAuthPlugin, { prefix: '/auth' });

  app.register(userEmailsPlugin, { prefix: '/emails' });
  app.register(userPhonesPlugin, { prefix: '/phones' });

  app.register(userAppPlugin, { prefix: '/apps' });
  app.register(userSecurityPlugin, { prefix: '/security' });

  done();
}

export async function getUserFromActionRequest(
  req: FastifyRequest,
): Promise<Meiling.Identity.User.UserInfoObject | undefined | null> {
  const users = await Meiling.V1.Session.getLoggedIn(req);
  const userId = (req.params as { userId: string }).userId;

  const user = users.find((n) => n.id === userId);

  return userId === undefined ? undefined : user === undefined ? null : user;
}
