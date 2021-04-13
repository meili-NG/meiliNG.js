import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { MeilingV1ClientRequest } from '..';
import { meilingV1UserActionGetUser } from '../..';
import { prisma } from '../../../../../../..';
import { User } from '../../../../../../../common';
import { sendMeilingError } from '../../../../error';
import { MeilingV1ErrorType } from '../../../../interfaces';
import { meilingV1UserAppsRedirectUriCRUDPlugin } from './redirect_uri';

export function meilingV1UserAppsAuthorizedActionsCombinedPlugin(
  app: FastifyInstance,
  opts: FastifyPluginOptions,
  done: () => void,
): void {
  // TODO: fix this wonky name
  app.register(meilingV1UserAppsAuthorizedActionsAuthorizedUserPlugin);
  app.register(meilingV1UserAppsAuthorizedActionsOwnerPlugin);

  done();
}

export function meilingV1UserAppsAuthorizedActionsAuthorizedUserPlugin(
  app: FastifyInstance,
  opts: FastifyPluginOptions,
  done: () => void,
): void {
  app.addHook('onRequest', (_req, rep, done) => {
    const req = _req as MeilingV1ClientRequest;

    if (!req.status.authorized) {
      sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED);
      throw new Error('Unauthorized!');
    }

    done();
  });

  app.get('/auth', async (_req, rep) => {
    const user = (await meilingV1UserActionGetUser(_req)) as User.UserInfoObject;
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

  app.delete('/auth', async (_req, rep) => {
    const user = (await meilingV1UserActionGetUser(_req)) as User.UserInfoObject;
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

  done();
}

export function meilingV1UserAppsAuthorizedActionsOwnerPlugin(
  app: FastifyInstance,
  opts: FastifyPluginOptions,
  done: () => void,
): void {
  app.addHook('onRequest', (_req, rep, done) => {
    const req = _req as MeilingV1ClientRequest;

    if (!req.status.owned) {
      sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED);
      throw new Error('Unauthorized!');
    }

    app.register(meilingV1UserAppsRedirectUriCRUDPlugin, { prefix: '/redirect_uri' });

    done();
  });

  done();
}
