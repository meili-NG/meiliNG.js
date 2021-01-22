import { FastifyInstance, FastifyRequest } from 'fastify';
import { User } from '../../../../../common';
import { getLoggedInMeilingV1Session } from '../../common';
import { meilingV1OAuthApplicationAuthCheckHandler } from './auth';

export interface MeilingV1UserActionsParams {
  userId: string;
}

export function registerV1MeilingUserActionsEndpoints(app: FastifyInstance, baseURI: string) {
  // /v1/meiling/user/:userId/action
  // TODO: Implement authentication

  app.get(baseURI + '/auth', meilingV1OAuthApplicationAuthCheckHandler);
}

export async function isMeilingV1UserActionPermitted(
  req: FastifyRequest,
): Promise<User.UserInfoObject | undefined | null> {
  const users = await getLoggedInMeilingV1Session(req);
  const userId = (req.params as { userId: string }).userId;

  const user = users.find((n) => n.id === userId);

  return userId === undefined ? undefined : user === undefined ? null : user;
}
