import { FastifyInstance, FastifyRequest } from 'fastify';
import { User } from '../../../../../common';
import { MeilingV1Session } from '../../common';
import { meilingV1OAuthClientAuthCheckHandler } from './auth';
import { meilingV1OAuthClientAuthHandler } from './auth/auth';
import { meilingV1OAuthClientPasswordsDeleteHandler } from './passwords/delete';
import { meilingV1OAuthClientPasswordsGetHandler } from './passwords/get';
import { meilingV1OAuthClientPasswordsPostHandler } from './passwords/post';
import { meilingV1OAuthClientPasswordsPutHandler } from './passwords/put';

export interface MeilingV1UserActionsParams {
  userId: string;
}

export function registerV1MeilingUserActionsEndpoints(app: FastifyInstance, baseURI: string) {
  // /v1/meiling/user/:userId/action
  // TODO: Implement authentication

  app.get(baseURI + '/auth', meilingV1OAuthClientAuthCheckHandler);
  app.post(baseURI + '/auth', meilingV1OAuthClientAuthHandler);
  app.get(baseURI + '/passwords', meilingV1OAuthClientPasswordsGetHandler);
  app.post(baseURI + '/passwords', meilingV1OAuthClientPasswordsPostHandler);
  app.put(baseURI + '/passwords', meilingV1OAuthClientPasswordsPutHandler);
  app.delete(baseURI + '/passwords', meilingV1OAuthClientPasswordsDeleteHandler);
}

export async function meilingV1UserActionGetUser(req: FastifyRequest): Promise<User.UserInfoObject | undefined | null> {
  const users = await MeilingV1Session.getLoggedIn(req);
  const userId = (req.params as { userId: string }).userId;

  const user = users.find((n) => n.id === userId);

  return userId === undefined ? undefined : user === undefined ? null : user;
}
