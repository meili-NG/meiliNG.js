import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { signupHandler } from './signup';

export function signupPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.post('/', signupHandler);

  done();
}
