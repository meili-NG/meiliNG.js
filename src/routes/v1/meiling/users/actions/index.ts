import { FastifyInstance, FastifyRequest } from 'fastify';
import { getLoggedInMeilingV1Session, getMeilingV1Session } from '../../common';

export function registerV1MeilingUserActionsEndpoints(app: FastifyInstance, baseURI: string) {
  // /v1/meiling/user/:userId/action
  // TODO: Implement authentication
}

export async function isMeilingV1UserActionPermitted(req: FastifyRequest): Promise<boolean> {
  const users = await getLoggedInMeilingV1Session(req);
  const userId = (req.params as { userId: string }).userId;

  const user = users.find((n) => n.id === userId);

  return user !== undefined;
}
