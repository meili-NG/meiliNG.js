import { PrismaClient } from '.prisma/client';
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { MeilingV1ClientRequest } from '../..';
import { getUserFromActionRequest } from '../../..';
import { User } from '../../../../../../../../common';

const prisma = new PrismaClient();

function appSessionPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void) {
  app.get('/sessions', async (_req, rep) => {
    const req = _req as MeilingV1ClientRequest;

    const user = (await getUserFromActionRequest(req)) as User.UserInfoObject;

    const sessions = await prisma.oAuthToken.findMany({
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
