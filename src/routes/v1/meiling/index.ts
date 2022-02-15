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
  app.setErrorHandler(async (_err, req, rep) => {
    const err = _err as Error;
    if ((err as Meiling.V1.Error.MeilingError)._isMeiling === true) {
      const mlError = err as Meiling.V1.Error.MeilingError;

      return mlError.sendFastify(rep);
    } else {
      // This is internal server error.
      if (_err.validation) {
        // if it is validation issue, the error type is INVALID_REQUEST
        const error = new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.INVALID_REQUEST);
        error.loadError(_err);

        return error.sendFastify(rep);
      } else {
        const error = new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.INTERNAL_SERVER_ERROR);
        error.loadError(_err);

        return error.sendFastify(rep);
      }
    }
  });

  app.setNotFoundHandler((req, rep) => {
    throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.NOT_FOUND);
  });

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
      throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.INVALID_SESSION);
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
