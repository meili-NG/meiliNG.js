import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { deviceCodeAuthorizeHandler } from './auth';
import { deviceCodeCheckHandler } from './check';

export function deviceCodeAuthPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void) {
  app.get('/device', deviceCodeCheckHandler);
  app.post('/device', deviceCodeAuthorizeHandler);

  done();
}
