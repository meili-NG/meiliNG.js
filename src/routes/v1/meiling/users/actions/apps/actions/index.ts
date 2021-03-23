import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { MeilingV1ClientRequest } from '..';
import { sendMeilingError } from '../../../../error';
import { MeilingV1ErrorType } from '../../../../interfaces';

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

    done();
  });

  done();
}
