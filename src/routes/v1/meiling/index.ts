import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from 'fastify';
import fastifyCors from 'fastify-cors';
import { NodeEnvironment } from '../../../interface';
import config from '../../../resources/config';
import { appsPlugin } from './apps';
import { meilingV1SessionAuthnPlugin } from './authentication';
import { Meiling } from '../../../common';
import { lostPasswordHandler } from './lost-password';
import { sessionPlugin } from './session';
import { signinHandler } from './signin';
import { signoutPlugin } from './signout';
import { signupPlugin } from './signup/';
import { userPlugin } from './users';

export interface FastifyRequestWithSession extends FastifyRequest {
  session: Meiling.V1.Interfaces.MeilingSession;
}

function meilingV1Plugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
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

function sessionRequiredPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.addHook('onRequest', async (req, rep) => {
    const session = await Meiling.V1.Session.getSessionFromRequest(req);
    if (!session) {
      Meiling.V1.Error.sendMeilingError(rep, Meiling.V1.Error.ErrorType.INVALID_SESSION);
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

  app.register(meilingV1SessionAuthnPlugin, { prefix: '/authn' });

  done();
}

export default meilingV1Plugin;
