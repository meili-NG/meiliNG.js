import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { MeilingV1ClientRequest } from '../..';
import { getUserFromActionRequest } from '../../..';
import { Meiling } from '../../../../../../../../common';
import { getPrismaClient } from '../../../../../../../../resources/prisma';

function appSessionPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void) {
  app.get('/sessions', async (_req, rep) => {
    const req = _req as MeilingV1ClientRequest;

    const user = (await getUserFromActionRequest(req)) as Meiling.Identity.User.UserInfoObject;

    const sessions = await getPrismaClient().oAuthToken.findMany({
      where: {
        authorization: {
          client: {
            id: req.client.id,
          },
          user: {
            id: user.id,
          },
        },
      },
    });

    return sessions.length;
  });

  done();
}

export default appSessionPlugin;
