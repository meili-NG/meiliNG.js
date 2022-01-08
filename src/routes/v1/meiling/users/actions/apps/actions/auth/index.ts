import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { MeilingV1ClientRequest } from '../..';
import { getUserFromActionRequest } from '../../..';
import { Meiling } from '../../../../../../../../common';
import { getPrismaClient } from '../../../../../../../../resources/prisma';

function appAuthPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.get('/', async (_req, rep) => {
    const user = (await getUserFromActionRequest(_req)) as Meiling.Identity.User.UserInfoObject;
    const req = _req as MeilingV1ClientRequest;

    const firstAuthorization = await getPrismaClient().oAuthClientAuthorization.findFirst({
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

    const lastAuthorization = await getPrismaClient().oAuthClientAuthorization.findFirst({
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
    const user = (await getUserFromActionRequest(_req)) as Meiling.Identity.User.UserInfoObject;
    const req = _req as MeilingV1ClientRequest;

    await getPrismaClient().oAuthToken.deleteMany({
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

    await getPrismaClient().oAuthClientAuthorization.deleteMany({
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

  done();
}

export default appAuthPlugin;
