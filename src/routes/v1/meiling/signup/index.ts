import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { Meiling } from '../../../../common';
import config from '../../../../resources/config';
import { signupHandler } from './signup';

export function signupPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.addHook('onRequest', (req, rep, next) => {
    if (!config.meiling.signup.enabled) {
      throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.NOT_IMPLEMENTED, 'Signup is disabled');
      return;
    }

    next();
  });

  app.post('/', signupHandler);

  done();
}
