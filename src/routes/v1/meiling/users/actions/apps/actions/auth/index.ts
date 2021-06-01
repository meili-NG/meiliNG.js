import { PrismaClient } from '.prisma/client';
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { MeilingV1ClientRequest } from '../..';
import { getUserFromActionRequest } from '../../..';
import { User } from '../../../../../../../../common';

const prisma = new PrismaClient();

function appAuthPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.get('/', async (_req, rep) => {
    const user = (await getUserFromActionRequest(_req)) as User.UserInfoObject;
    const req = _req as MeilingV1ClientRequest;

    const firstAuthorization = await prisma.oAuthClientAuthorization.findFirst({
      where: {
        client: {
          id: req.client.id,
        },
        user: {
          id: user.id,
        },
      },
      orderBy: {
        authorizedAt: 'asc',
      },
    });

    const lastAuthorization = await prisma.oAuthClientAuthorization.findFirst({
      where: {
        client: {
          id: req.client.id,
        },
        user: {
          id: user.id,
        },
      },
      orderBy: {
        authorizedAt: 'desc',
      },
    });

    rep.send({
      authorizedAt: firstAuthorization?.authorizedAt,
      lastAuthAt: lastAuthorization?.authorizedAt,
    });
  });

  app.delete('/', async (_req, rep) => {
    const user = (await getUserFromActionRequest(_req)) as User.UserInfoObject;
    const req = _req as MeilingV1ClientRequest;

    await prisma.oAuthToken.deleteMany({
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

    await prisma.oAuthClientAuthorization.deleteMany({
      where: {
        client: {
          id: req.client.id,
        },
        user: {
          id: user.id,
        },
      },
    });

    rep.send({
      success: true,
    });
  });
}

export default appAuthPlugin;
