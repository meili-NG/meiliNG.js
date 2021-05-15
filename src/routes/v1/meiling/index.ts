import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from 'fastify';
import fastifyCors from 'fastify-cors';
import config from '../../../resources/config';
import { meilingV1AppsPlugin } from './apps';
import { meilingV1AuthorizationPlugin } from './authorization';
import { MeilingV1Session } from './common';
import { sendMeilingError } from './error';
import { MeilingV1ErrorType, MeilingV1Session as SessionObject } from './interfaces';
import { meilingV1LostPasswordHandler } from './lost-password';
import { v1MeilingSessionPlugin } from './session';
import { meilingV1SigninHandler } from './signin';
import { meilingV1SignoutHandler } from './signout';
import { v1MeilingSignupPlugin } from './signup/';
import { meilingV1UserPlugin } from './users';
import { NodeEnvironment } from '../../../interface';

export interface FastifyRequestWithSession extends FastifyRequest {
  session: SessionObject;
}

export function v1MeilingPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.register(fastifyCors, {
    origin: config.node.environment === NodeEnvironment.Development ? '*' : config.frontend.url,
  });

  app.get('/', (req, rep) => {
    rep.send({
      version: 1,
      engine: 'Meiling Project',
      api: 'Meiling Endpoints',
    });
  });

  app.register(v1MeilingSessionPlugin, { prefix: '/session' });
  app.register(v1MeilingSessionRequiredPlugin);
  done();
}

export function v1MeilingSessionRequiredPlugin(
  app: FastifyInstance,
  opts: FastifyPluginOptions,
  done: () => void,
): void {
  app.addHook('onRequest', async (req, rep) => {
    const session = await MeilingV1Session.getSessionFromRequest(req);
    if (!session) {
      sendMeilingError(rep, MeilingV1ErrorType.INVALID_SESSION);
      throw new Error();
    }

    (req as FastifyRequestWithSession).session = session;
  });

  app.post('/signin', meilingV1SigninHandler);
  app.register(v1MeilingSignupPlugin, { prefix: '/signup' });

  app.post('/lost-password', meilingV1LostPasswordHandler);

  app.get('/signout', meilingV1SignoutHandler);
  app.get('/signout/:userId', meilingV1SignoutHandler);

  app.register(meilingV1UserPlugin, { prefix: '/users' });
  app.register(meilingV1AppsPlugin, { prefix: '/apps' });
  app.register(meilingV1AuthorizationPlugin, { prefix: '/authorization' });

  done();
}
