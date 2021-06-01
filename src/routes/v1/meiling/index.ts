import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from 'fastify';
import fastifyCors from 'fastify-cors';
import { NodeEnvironment } from '../../../interface';
import config from '../../../resources/config';
import { appsPlugin } from './apps';
import { meilingV1AuthorizationPlugin } from './authorization';
import { MeilingV1Session } from './common';
import { sendMeilingError } from './error';
import { MeilingV1ErrorType, MeilingV1Session as SessionObject } from './interfaces';
import { lostPasswordHandler } from './lost-password';
import { sessionPlugin } from './session';
import { signinHandler } from './signin';
import { signoutPlugin } from './signout';
import { signupPlugin } from './signup/';
import { userPlugin } from './users';

export interface FastifyRequestWithSession extends FastifyRequest {
  session: SessionObject;
}

export function meilingV1Plugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
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

  app.register(sessionPlugin, { prefix: '/session' });
  app.register(sessionRequiredPlugin);
  done();
}

export function sessionRequiredPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.addHook('onRequest', async (req, rep) => {
    const session = await MeilingV1Session.getSessionFromRequest(req);
    if (!session) {
      sendMeilingError(rep, MeilingV1ErrorType.INVALID_SESSION);
      throw new Error();
    }

    (req as FastifyRequestWithSession).session = session;
  });

  app.post('/signin', signinHandler);
  app.register(signupPlugin, { prefix: '/signup' });

  app.post('/lost-password', lostPasswordHandler);

  app.register(signoutPlugin, { prefix: '/signout' });

  app.register(userPlugin, { prefix: '/users' });
  app.register(appsPlugin, { prefix: '/apps' });
  app.register(meilingV1AuthorizationPlugin, { prefix: '/authorization' });

  done();
}
