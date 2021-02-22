import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from 'fastify';
import { User } from '../../../../../common';
import { MeilingV1Session } from '../../common';
import { sendMeilingError } from '../../error';
import { MeilingV1ErrorType } from '../../interfaces';
import { meilingV1OAuthClientAuthCheckHandler } from './auth';
import { meilingV1OAuthClientAuthHandler } from './auth/auth';
import { meilingV1OAuthClientDeviceAuthHandler } from './auth/device/auth';
import { meilingV1OAuthClientDeviceAuthCheckHandler } from './auth/device/check';
import { meilingV1OAuthClientPasswordsDeleteHandler } from './passwords/delete';
import { meilingV1OAuthClientPasswordsGetHandler } from './passwords/get';
import { meilingV1OAuthClientPasswordsPostHandler } from './passwords/post';
import { meilingV1OAuthClientPasswordsPutHandler } from './passwords/put';

export interface MeilingV1UserActionsParams {
  userId: string;
}

export function meilingV1UserActionsHandler(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void) {
  // /v1/meiling/user/:userId/action
  // TODO: Implement authentication
  app.addHook('onRequest', async (req, rep) => {
    const userBase = await meilingV1UserActionGetUser(req);
    if (userBase === undefined) {
      sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'invalid request.');
      throw new Error('User is not privileged to run this command');
    } else if (userBase === null) {
      sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED, 'you are not logged in as specified user.');
      throw new Error('User is not privileged to run this command');
    }
  });

  app.get('/auth', meilingV1OAuthClientAuthCheckHandler);
  app.post('/auth', meilingV1OAuthClientAuthHandler);

  app.get('/auth/device', meilingV1OAuthClientDeviceAuthCheckHandler);
  app.post('/auth/device', meilingV1OAuthClientDeviceAuthHandler);

  app.get('/passwords', meilingV1OAuthClientPasswordsGetHandler);
  app.post('/passwords', meilingV1OAuthClientPasswordsPostHandler);
  app.put('/passwords', meilingV1OAuthClientPasswordsPutHandler);
  app.delete('/passwords', meilingV1OAuthClientPasswordsDeleteHandler);

  done();
}

export async function meilingV1UserActionGetUser(req: FastifyRequest): Promise<User.UserInfoObject | undefined | null> {
  const users = await MeilingV1Session.getLoggedIn(req);
  const userId = (req.params as { userId: string }).userId;

  const user = users.find((n) => n.id === userId);

  return userId === undefined ? undefined : user === undefined ? null : user;
}
